export interface CompressionResult {
    file: File;
    originalSize: number;
    processedSize: number;
    timeTaken: number;
}

class VideoCompressionUtility {
    // Video settings for reels
    private static videoOptions = {
        maxDuration: 60, // 60 seconds maximum
        mimeType: 'video/mp4'
    };

    static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static async trimVideo(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<CompressionResult> {
        const startTime = Date.now();

        try {
            // Create a video element to get metadata
            const video = document.createElement('video');
            const objectUrl = URL.createObjectURL(file);

            // Get video metadata
            const metadata = await new Promise<{ duration: number }>((resolve, reject) => {
                video.addEventListener('loadedmetadata', () => {
                    resolve({
                        duration: video.duration
                    });
                });

                video.addEventListener('error', () => {
                    reject(new Error('Failed to load video metadata'));
                });

                video.src = objectUrl;
            });

            // Check if video needs trimming
            const needsTrimming = metadata.duration > this.videoOptions.maxDuration;

            if (!needsTrimming) {
                URL.revokeObjectURL(objectUrl);
                return {
                    file,
                    originalSize: file.size,
                    processedSize: file.size,
                    timeTaken: Date.now() - startTime
                };
            }

            // Capture video stream
            const stream = await this.captureVideoStream(video);
            
            // Calculate duration to record
            const duration = Math.min(metadata.duration, this.videoOptions.maxDuration);
            
            // Record the trimmed video
            const trimmedBlob = await this.recordStream(stream, duration, onProgress);
            
            URL.revokeObjectURL(objectUrl);
            
            const trimmedFile = new File(
                [trimmedBlob],
                `trimmed_${file.name.split('.')[0]}.mp4`,
                { type: this.videoOptions.mimeType }
            );

            onProgress?.(100);

            const timeTaken = Date.now() - startTime;

            console.log(`🎥 Video processed: ${this.formatBytes(file.size)} → ${this.formatBytes(trimmedFile.size)} (trimmed to 60s)`);

            return {
                file: trimmedFile,
                originalSize: file.size,
                processedSize: trimmedFile.size,
                timeTaken
            };

        } catch (error) {
            console.error('Video trimming failed:', error);
            // Return original file as fallback
            return {
                file,
                originalSize: file.size,
                processedSize: file.size,
                timeTaken: Date.now() - startTime
            };
        }
    }

    private static async captureVideoStream(video: HTMLVideoElement): Promise<MediaStream> {
        // Wait for video to be ready
        await new Promise((resolve) => {
            video.addEventListener('canplay', resolve, { once: true });
        });

        // Capture the video stream directly
        return video.captureStream(30); // 30 FPS
    }

    private static async recordStream(stream: MediaStream, duration: number, onProgress?: (progress: number) => void): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const chunks: Blob[] = [];
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: this.videoOptions.mimeType
            });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: this.videoOptions.mimeType });
                resolve(blob);
            };

            mediaRecorder.onerror = (e) => {
                reject(e);
            };

            // Start recording
            mediaRecorder.start();

            // Update progress
            let progressInterval: NodeJS.Timeout;
            if (onProgress) {
                let elapsed = 0;
                progressInterval = setInterval(() => {
                    elapsed += 0.1;
                    const progress = Math.min(90, (elapsed / duration) * 90);
                    onProgress(progress);
                }, 100);
            }

            // Stop recording after duration
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
                if (progressInterval) {
                    clearInterval(progressInterval);
                }
            }, duration * 1000);
        });
    }
}

export default VideoCompressionUtility;