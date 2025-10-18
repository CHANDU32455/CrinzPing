import imageCompression from 'browser-image-compression';

export interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    timeTaken: number;
}

export interface CompressionStats {
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalCompressionRatio: number;
    totalTimeTaken: number;
    files: CompressionResult[];
}

class CompressionUtility {
    // Production image compression settings
    private static imageOptions = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/webp',
        quality: 0.65,
        maxIteration: 15,
        exifOrientation: 1
    };

    // Audio settings
    private static maxAudioDuration = 30; // 30 seconds maximum

    // Video settings
    // Video settings - changed maxDuration from 60 to 30 seconds
    private static videoOptions = {
        maxSizeMB: 50,
        maxWidth: 1080,
        maxHeight: 1920, // Vertical format for reels
        maxDuration: 30, // 30 seconds maximum for reels
        quality: 0.7,
        codec: 'avc1.42002A', // H.264 codec for broad compatibility
        mimeType: 'video/mp4'
    };

    // Make formatBytes public
    static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Trim audio to 30 seconds maximum
    static async trimAudio(audioFile: File): Promise<File> {
        return new Promise((resolve, reject) => {
            const audioContext = new AudioContext();
            const fileReader = new FileReader();

            fileReader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                    // Calculate duration and trim if necessary
                    const duration = audioBuffer.duration;
                    const trimTo = Math.min(duration, this.maxAudioDuration);

                    if (duration <= this.maxAudioDuration) {
                        // No trimming needed
                        resolve(audioFile);
                        return;
                    }

                    // Create new audio buffer with trimmed content
                    const sampleRate = audioBuffer.sampleRate;
                    const newLength = Math.floor(trimTo * sampleRate);
                    const newBuffer = audioContext.createBuffer(
                        audioBuffer.numberOfChannels,
                        newLength,
                        sampleRate
                    );

                    // Copy first 30 seconds of each channel
                    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                        const channelData = audioBuffer.getChannelData(channel);
                        const newChannelData = newBuffer.getChannelData(channel);
                        for (let i = 0; i < newLength; i++) {
                            newChannelData[i] = channelData[i];
                        }
                    }

                    // Convert back to file
                    const wavBlob = await this.audioBufferToWav(newBuffer);
                    const trimmedFile = new File(
                        [wavBlob],
                        `trimmed_${audioFile.name}`,
                        { type: 'audio/wav' }
                    );

                    console.log(`✂️ Audio trimmed from ${duration.toFixed(1)}s to ${trimTo}s`);
                    resolve(trimmedFile);

                } catch (error) {
                    console.error('Audio trimming failed:', error);
                    resolve(audioFile); // Fallback to original
                }
            };

            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(audioFile);
        });
    }

    // Convert AudioBuffer to WAV blob
    private static async audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
        return new Promise((resolve) => {
            const numberOfChannels = buffer.numberOfChannels;
            const length = buffer.length;
            const sampleRate = buffer.sampleRate;
            const bitsPerSample = 16;
            const bytesPerSample = bitsPerSample / 8;
            const blockAlign = numberOfChannels * bytesPerSample;
            const byteRate = sampleRate * blockAlign;
            const dataSize = length * blockAlign;

            const arrayBuffer = new ArrayBuffer(44 + dataSize);
            const view = new DataView(arrayBuffer);

            // Write WAV header
            this.writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + dataSize, true);
            this.writeString(view, 8, 'WAVE');
            this.writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, numberOfChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, byteRate, true);
            view.setUint16(32, blockAlign, true);
            view.setUint16(34, bitsPerSample, true);
            this.writeString(view, 36, 'data');
            view.setUint32(40, dataSize, true);

            // Write audio data
            let offset = 44;
            for (let i = 0; i < length; i++) {
                for (let channel = 0; channel < numberOfChannels; channel++) {
                    const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                    offset += 2;
                }
            }

            resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
        });
    }

    private static writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // Compress single image with error handling
    static async compressImage(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<CompressionResult> {
        const startTime = Date.now();

        try {
            const compressedFile = await imageCompression(file, {
                ...this.imageOptions,
                onProgress: (progress) => onProgress?.(Math.round(progress))
            });

            const timeTaken = Date.now() - startTime;

            return {
                file: compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                compressionRatio: (compressedFile.size / file.size) * 100,
                timeTaken
            };

        } catch (error) {
            console.error('Image compression failed:', error);
            // Return original file as fallback
            return {
                file,
                originalSize: file.size,
                compressedSize: file.size,
                compressionRatio: 100,
                timeTaken: Date.now() - startTime
            };
        }
    }

    static async compressVideo(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<CompressionResult> {
        const startTime = Date.now();

        try {
            // Create a video element to get metadata
            const video = document.createElement('video');
            const objectUrl = URL.createObjectURL(file);

            // Get video metadata
            const metadata = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
                video.addEventListener('loadedmetadata', () => {
                    resolve({
                        duration: video.duration,
                        width: video.videoWidth,
                        height: video.videoHeight
                    });
                });

                video.addEventListener('error', () => {
                    reject(new Error('Failed to load video metadata'));
                });

                video.src = objectUrl;
            });

            // Check if video needs compression or trimming
            const needsCompression = file.size > this.videoOptions.maxSizeMB * 1024 * 1024 ||
                metadata.width > this.videoOptions.maxWidth ||
                metadata.height > this.videoOptions.maxHeight;

            const needsTrimming = metadata.duration > this.videoOptions.maxDuration;

            if (!needsCompression && !needsTrimming) {
                URL.revokeObjectURL(objectUrl);
                return {
                    file,
                    originalSize: file.size,
                    compressedSize: file.size,
                    compressionRatio: 100,
                    timeTaken: Date.now() - startTime
                };
            }

            // Create canvas for video processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                URL.revokeObjectURL(objectUrl);
                throw new Error('Could not get canvas context');
            }

            // Calculate scaled dimensions while maintaining aspect ratio
            const aspectRatio = metadata.width / metadata.height;
            let targetWidth = this.videoOptions.maxWidth;
            let targetHeight = this.videoOptions.maxHeight;

            if (aspectRatio > 1) {
                // Landscape
                targetHeight = Math.min(targetHeight, Math.round(targetWidth / aspectRatio));
            } else {
                // Portrait or square
                targetWidth = Math.min(targetWidth, Math.round(targetHeight * aspectRatio));
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Wait for video to be ready
            await new Promise((resolve) => {
                video.addEventListener('canplay', resolve, { once: true });
            });

            // Create a MediaStream from the canvas
            const stream = canvas.captureStream(30); // 30 FPS

            // Create MediaRecorder with compression settings
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: this.videoOptions.mimeType,
                videoBitsPerSecond: 1500000 // 1.5 Mbps for good quality
            });

            const chunks: Blob[] = [];
            let progressCounter = 0;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                    progressCounter++;
                    onProgress?.(Math.min(90, (progressCounter * 10)));
                }
            };

            // Start recording
            mediaRecorder.start();

            // Draw video frames to canvas
            // const startTime = 0;
            const duration = Math.min(metadata.duration, this.videoOptions.maxDuration);

            // Set video to start time
            video.currentTime = startTime;

            // Wait for video to seek to the start position
            await new Promise((resolve) => {
                video.addEventListener('seeked', resolve, { once: true });
            });

            let recordingStartTime = Date.now();
            let lastFrameTime = 0;

            const drawFrame = () => {
                const currentTime = (Date.now() - recordingStartTime) / 1000;

                if (currentTime >= duration) {
                    mediaRecorder.stop();
                    return;
                }

                // Only draw if enough time has passed (for 30fps)
                if (currentTime - lastFrameTime >= 1 / 30) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                    lastFrameTime = currentTime;
                }

                requestAnimationFrame(drawFrame);
            };

            // Start drawing frames
            drawFrame();

            // Wait for recording to finish
            await new Promise<void>((resolve) => {
                mediaRecorder.onstop = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve();
                };
            });

            // Create compressed video file
            const compressedBlob = new Blob(chunks, { type: this.videoOptions.mimeType });
            const compressedFile = new File(
                [compressedBlob],
                `compressed_${file.name.split('.')[0]}.mp4`,
                { type: this.videoOptions.mimeType }
            );

            onProgress?.(100);

            const timeTaken = Date.now() - startTime;

            console.log(`🎥 Video processed: ${CompressionUtility.formatBytes(file.size)} → ${CompressionUtility.formatBytes(compressedFile.size)} (${needsTrimming ? 'trimmed to 30s, ' : ''}${Math.round((compressedFile.size / file.size) * 100)}% of original)`);

            return {
                file: compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                compressionRatio: (compressedFile.size / file.size) * 100,
                timeTaken
            };

        } catch (error) {
            console.error('Video compression failed:', error);
            // Return original file as fallback
            return {
                file,
                originalSize: file.size,
                compressedSize: file.size,
                compressionRatio: 100,
                timeTaken: Date.now() - startTime
            };
        }
    }

    // Compress multiple images with parallel processing
    static async compressImages(
        files: File[],
        onProgress?: (progress: number, index: number) => void
    ): Promise<CompressionStats> {
        const startTime = Date.now();
        const results: CompressionResult[] = [];

        // Process images in parallel with limited concurrency
        const concurrencyLimit = 3;

        for (let i = 0; i < files.length; i += concurrencyLimit) {
            const batch = files.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map((file, batchIndex) =>
                this.compressImage(file, (progress) => {
                    onProgress?.(progress, i + batchIndex);
                })
            );

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        const totalTimeTaken = Date.now() - startTime;
        const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
        const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);

        return {
            totalOriginalSize,
            totalCompressedSize,
            totalCompressionRatio: (totalCompressedSize / totalOriginalSize) * 100,
            totalTimeTaken,
            files: results
        };
    }

    // Create form data payload for API upload
    static async createFormData(
        images: CompressionResult[],
        audio: File | null,
        video: File | null,
        caption: string,
        tags: string
    ): Promise<{ formData: FormData; stats: CompressionStats }> {
        const formData = new FormData();
        const stats: CompressionStats = {
            totalOriginalSize: 0,
            totalCompressedSize: 0,
            totalCompressionRatio: 0,
            totalTimeTaken: 0,
            files: []
        };

        // Add compressed images
        images.forEach((result, index) => {
            formData.append(`image_${index}`, result.file);
            stats.totalOriginalSize += result.originalSize;
            stats.totalCompressedSize += result.compressedSize;
            stats.files.push(result);
        });

        // Add trimmed audio if exists
        let processedAudio: File | null = null;
        if (audio) {
            try {
                processedAudio = await this.trimAudio(audio);
                formData.append('audio', processedAudio);
                console.log(`🎵 Audio processed: ${this.formatBytes(audio.size)} → ${this.formatBytes(processedAudio.size)}`);
            } catch (error) {
                console.error('Audio processing failed, using original:', error);
                formData.append('audio', audio);
                processedAudio = audio;
            }
        }

        // Add compressed video if exists
        let processedVideo: File | null = null;
        if (video) {
            try {
                const videoResult = await this.compressVideo(video);
                processedVideo = videoResult.file;
                formData.append('video', processedVideo);
                stats.totalOriginalSize += videoResult.originalSize;
                stats.totalCompressedSize += videoResult.compressedSize;
                stats.files.push(videoResult);
                console.log(`🎥 Video processed: ${this.formatBytes(video.size)} → ${this.formatBytes(processedVideo.size)}`);
            } catch (error) {
                console.error('Video processing failed, using original:', error);
                formData.append('video', video);
                processedVideo = video;
                stats.totalOriginalSize += video.size;
                stats.totalCompressedSize += video.size;
                stats.files.push({
                    file: video,
                    originalSize: video.size,
                    compressedSize: video.size,
                    compressionRatio: 100,
                    timeTaken: 0
                });
            }
        }

        // Add metadata
        formData.append('caption', caption);
        formData.append('tags', tags);
        formData.append('compression_stats', JSON.stringify({
            original_total: stats.totalOriginalSize,
            compressed_total: stats.totalCompressedSize,
            ratio: (stats.totalCompressedSize / stats.totalOriginalSize * 100).toFixed(2) + '%',
            image_count: images.length,
            has_audio: !!audio,
            has_video: !!video,
            audio_trimmed: audio && processedAudio !== audio,
            video_compressed: video && processedVideo !== video
        }));

        stats.totalCompressionRatio = (stats.totalCompressedSize / stats.totalOriginalSize) * 100;

        return { formData, stats };
    }

    // Log compression results for monitoring
    static logCompressionStats(stats: CompressionStats, type: 'post' | 'reel'): void {
        console.group(`📊 ${type.toUpperCase()} Compression Results`);
        console.log(`Total Original: ${this.formatBytes(stats.totalOriginalSize)}`);
        console.log(`Total Compressed: ${this.formatBytes(stats.totalCompressedSize)}`);
        console.log(`Compression Ratio: ${stats.totalCompressionRatio.toFixed(2)}%`);
        console.log(`Time Taken: ${stats.totalTimeTaken}ms`);
        console.log(`Files Processed: ${stats.files.length}`);

        stats.files.forEach((file, index) => {
            console.log(
                `File ${index + 1}: ${this.formatBytes(file.originalSize)} → ${this.formatBytes(file.compressedSize)} ` +
                `(${file.compressionRatio.toFixed(2)}%) in ${file.timeTaken}ms`
            );
        });

        console.groupEnd();
    }
}

export default CompressionUtility;