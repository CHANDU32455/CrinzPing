import { renderHook, waitFor, act } from '@testing-library/react'
import { useReels } from '../../../feed/hooks/usereels'
import axios from 'axios'
import { useAuth } from 'react-oidc-context'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { type Mock } from 'vitest'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as unknown as { post: Mock }

// Mock useAuth
vi.mock('react-oidc-context', () => ({
    useAuth: vi.fn(),
}))

describe('useReels', () => {
    const mockUser = {
        access_token: 'mock-token',
    }

    beforeEach(() => {
        vi.clearAllMocks()
            ; (useAuth as Mock).mockReturnValue({
                user: mockUser,
            })
    })

    it('should fetch reels successfully on mount', async () => {
        const mockReels = [
            { postId: '1', caption: 'Reel 1' },
            { postId: '2', caption: 'Reel 2' },
        ]
        const mockResponse = {
            data: {
                reels: mockReels,
                lastEvaluatedKey: { id: '2' },
            },
        }
        vi.mocked(axios.post).mockResolvedValue(mockResponse)

        console.log('Rendering hook...')
        const { result } = renderHook(() => useReels())

        // Initial state
        expect(result.current.loading).toBe(true)
        expect(result.current.reels).toEqual([])

        // Wait for fetch to complete
        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        expect(result.current.reels).toHaveLength(2)
        expect(result.current.reels[0].postId).toBe('1')
        expect(result.current.hasMore).toBe(true)
        // expect(mockedAxios.post).toHaveBeenCalledTimes(1)
        console.log('Reels in test:', result.current.reels)
    })

    it('should handle fetch error', async () => {
        mockedAxios.post.mockRejectedValue(new Error('Network error'))

        const { result } = renderHook(() => useReels())

        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        expect(result.current.error).toBe('Network error')
        expect(result.current.reels).toEqual([])
    })

    it('should load more reels when loadMore is called', async () => {
        // First fetch
        const mockReels1 = [{ postId: '1' }]
        mockedAxios.post.mockResolvedValueOnce({
            data: { reels: mockReels1, lastEvaluatedKey: { id: '1' } },
        })

        const { result } = renderHook(() => useReels())

        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        // Second fetch (load more)
        const mockReels2 = [{ postId: '2' }]
        mockedAxios.post.mockResolvedValueOnce({
            data: { reels: mockReels2, lastEvaluatedKey: null },
        })

        act(() => {
            result.current.loadMore()
        })

        await waitFor(() => {
            expect(result.current.reels).toHaveLength(2)
        })

        expect(result.current.reels[1].postId).toBe('2')
        expect(result.current.hasMore).toBe(false)
    })

    it('should refresh reels', async () => {
        // First fetch
        mockedAxios.post.mockResolvedValueOnce({
            data: { reels: [{ postId: '1' }], lastEvaluatedKey: { id: '1' } },
        })

        const { result } = renderHook(() => useReels())

        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        // Refresh
        mockedAxios.post.mockResolvedValueOnce({
            data: { reels: [{ postId: '3' }], lastEvaluatedKey: null },
        })

        act(() => {
            result.current.refresh()
        })

        // Wait for the effect to trigger the new fetch
        await waitFor(() => {
            // We expect the reels to be replaced, not appended
            // Note: The hook clears reels on search term change, but refresh just resets keys/state
            // which triggers the effect. The effect calls fetchReels(false).
            // fetchReels(false) replaces the state.
            expect(result.current.reels[0].postId).toBe('3')
        })

        expect(result.current.reels).toHaveLength(1)
    })
})
