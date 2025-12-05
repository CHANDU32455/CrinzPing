import { render } from '@testing-library/react'
import App from '../App'
import { describe, it, expect, vi } from 'vitest'

// Mock the AuthProvider and useAuth from react-oidc-context
vi.mock('react-oidc-context', () => ({
    useAuth: () => ({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        signinRedirect: vi.fn(),
        removeUser: vi.fn(),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock other providers if necessary, but they seem to be internal contexts
// If they have side effects or require specific props, we might need to mock them too.
// For now, let's assume they are safe to render or will use default values.

describe('App', () => {
    it('renders without crashing', () => {
        const { container } = render(<App />)
        expect(container).toBeDefined()
    })
})
