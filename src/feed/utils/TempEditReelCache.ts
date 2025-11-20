// utils/videoCache.ts
interface CachedVideo {
    file: File;
    url: string;
    timestamp: number;
    postId: string;
}
// utils/videoCache.ts - Fix the class structure
class VideoCache {
    private cache: Map<string, CachedVideo> = new Map();
    private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

    async getVideo(postId: string, videoUrl: string): Promise<File | null> {
        const cached = this.cache.get(postId);

        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            console.log('🎬 Using cached video for post:', postId);
            return cached.file;
        }

        // Clear expired cache
        this.clearExpired();

        // Download and cache the video
        console.log('📥 Downloading video for post:', postId);
        const videoFile = await this.downloadVideo(videoUrl, postId);

        if (videoFile) {
            this.cache.set(postId, {
                file: videoFile,
                url: videoUrl,
                timestamp: Date.now(),
                postId
            });
            console.log('✅ Video cached successfully for post:', postId);
        }

        return videoFile;
    }

    // Move this method outside of getVideo - fix the placement
    getVideoFromCache(postId: string): File | undefined {
        const cached = this.cache.get(postId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.file;
        }
        return undefined; // Return undefined instead of null
    }

    private async downloadVideo(videoUrl: string, postId: string): Promise<File | null> {
        try {
            const response = await fetch(videoUrl);
            if (!response.ok) {
                throw new Error(`Failed to download video: ${response.status}`);
            }

            const blob = await response.blob();
            
            // Ensure we have a valid blob
            if (!blob || blob.size === 0) {
                throw new Error('Downloaded blob is empty');
            }

            const fileName = `reel-${postId}-${Date.now()}.mp4`;
            const file = new File([blob], fileName, { 
                type: blob.type || 'video/mp4',
                lastModified: Date.now()
            });

            console.log('📹 Video downloaded successfully:', {
                size: blob.size,
                type: blob.type,
                fileName
            });

            return file;
        } catch (error) {
            console.error('❌ Failed to download video:', error);
            return null;
        }
    }

    clearExpired(): void {
        const now = Date.now();
        for (const [postId, cached] of this.cache.entries()) {
            if (now - cached.timestamp > this.CACHE_DURATION) {
                this.cache.delete(postId);
                console.log('🗑️ Cleared expired cache for post:', postId);
            }
        }
    }

    clearCache(postId?: string): void {
        if (postId) {
            this.cache.delete(postId);
            console.log('🗑️ Cleared cache for post:', postId);
        } else {
            this.cache.clear();
            console.log('🗑️ Cleared all video cache');
        }
    }

    getCacheSize(): number {
        return this.cache.size;
    }
}

export const videoCache = new VideoCache();