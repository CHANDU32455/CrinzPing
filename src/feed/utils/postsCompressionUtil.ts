import imageCompression from 'browser-image-compression';
import { Mp3Encoder } from "@breezystack/lamejs";

// Fix lamejs typing locally
declare module "lamejs" {
    interface Mp3Encoder {
        encodeBuffer(left: Int16Array, right: Int16Array): Int8Array[];
    }
}

export interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    timeTaken: number;
    isCompressed: boolean; // Add this
    isTrimmed: boolean;    // Add this
}

export interface CompressionStats {
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalCompressionRatio: number;
    totalTimeTaken: number;
    files: CompressionResult[];
}

class PostCompressionUtility {
    // Image compression settings for posts
    private static imageOptions = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/webp',
        quality: 0.65,
        maxIteration: 15,
        exifOrientation: 1
    };

    // Audio settings for posts
    private static maxAudioDuration = 30; // 30 seconds maximum
    private static targetBitrate = 64; // 64 kbps for decent quality at small size

    static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Trim audio to 30 seconds maximum (for preview)
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

    // Convert AudioBuffer to WAV blob (for preview)
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

    // Compress audio to MP3 for final submission
    static async compressAudio(audioFile: File): Promise<File> {
        const startTime = Date.now();

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

                    // Create new audio buffer with trimmed content
                    const sampleRate = audioBuffer.sampleRate;
                    const newLength = Math.floor(trimTo * sampleRate);
                    const newBuffer = audioContext.createBuffer(
                        audioBuffer.numberOfChannels,
                        newLength,
                        sampleRate
                    );

                    // Copy audio data
                    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                        const channelData = audioBuffer.getChannelData(channel);
                        const newChannelData = newBuffer.getChannelData(channel);
                        for (let i = 0; i < newLength; i++) {
                            newChannelData[i] = channelData[i];
                        }
                    }

                    // Convert to MP3 using lamejs
                    const mp3Data: Uint8Array = this.encodeAudioBufferToMP3(newBuffer, this.targetBitrate);

                    // Convert mp3Data to a proper Uint8Array backed by a plain ArrayBuffer
                    const properMp3Data = new Uint8Array(mp3Data.buffer as ArrayBuffer, mp3Data.byteOffset, mp3Data.byteLength);
                    const mp3Blob = new Blob([properMp3Data], { type: "audio/mp3" });

                    const compressedFile = new globalThis.File(
                        [mp3Blob],
                        `compressed_${audioFile.name.replace(/\.[^/.]+$/, '')}.mp3`,
                        { type: "audio/mp3" }
                    );


                    const timeTaken = Date.now() - startTime;

                    console.log(`🎵 Audio compressed: ${this.formatBytes(audioFile.size)} → ${this.formatBytes(compressedFile.size)}`);
                    console.log(`⏱️ Duration: ${trimTo.toFixed(1)}s`);
                    console.log(`⚡ Bitrate: ${this.targetBitrate}kbps`);
                    console.log(`⏰ Time taken: ${timeTaken}ms`);

                    resolve(compressedFile);

                } catch (error) {
                    console.error('Audio compression failed:', error);
                    // Fallback: return original but limit size
                    if (audioFile.size > 200 * 1024) {
                        const compressedFile = new File(
                            [audioFile.slice(0, 200 * 1024)],
                            `compressed_${audioFile.name}`,
                            { type: audioFile.type }
                        );
                        resolve(compressedFile);
                    } else {
                        resolve(audioFile);
                    }
                }
            };

            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(audioFile);
        });
    }

    // Encode AudioBuffer to MP3 using lamejs
    private static encodeAudioBufferToMP3(buffer: AudioBuffer, bitrate: number): Uint8Array {
        const channels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const samples = buffer.length;

        const encoder = new Mp3Encoder(channels, sampleRate, bitrate);
        const maxSamples = 1152;
        const left = buffer.getChannelData(0);
        const right = channels > 1 ? buffer.getChannelData(1) : left;

        const mp3Data: Uint8Array[] = [];

        const floatTo16BitPCM = (input: Float32Array): Int16Array => {
            const output = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
                const s = Math.max(-1, Math.min(1, input[i]));
                output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            return output;
        };

        for (let i = 0; i < samples; i += maxSamples) {
            const leftChunk = floatTo16BitPCM(left.subarray(i, i + maxSamples));
            if (channels === 2) {
                const rightChunk = floatTo16BitPCM(right.subarray(i, i + maxSamples));
                const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            } else {
                const mp3buf = encoder.encodeBuffer(leftChunk);
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
        }

        const mp3buf = encoder.flush();
        if (mp3buf.length > 0) mp3Data.push(mp3buf);

        // Concatenate all Uint8Array chunks
        const totalLength = mp3Data.reduce((sum, arr) => sum + arr.length, 0);
        const merged = new Uint8Array(totalLength);
        let offset = 0;
        for (const arr of mp3Data) {
            merged.set(arr, offset);
            offset += arr.length;
        }

        return merged;
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
            const wasCompressed = compressedFile.size < file.size;

            return {
                file: compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                compressionRatio: (compressedFile.size / file.size) * 100,
                timeTaken,
                isCompressed: wasCompressed,
                isTrimmed: false // Images don't get trimmed
            };

        } catch (error) {
            console.error('Image compression failed:', error);
            // Return original file as fallback
            return {
                file,
                originalSize: file.size,
                compressedSize: file.size,
                compressionRatio: 100,
                timeTaken: Date.now() - startTime,
                isCompressed: false,
                isTrimmed: false
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

        // Add compressed audio if exists
        let processedAudio: File | null = null;
        if (audio) {
            try {
                processedAudio = await this.compressAudio(audio);
                formData.append('audio', processedAudio);
                stats.totalOriginalSize += audio.size;
                stats.totalCompressedSize += processedAudio.size;
                console.log(`🎵 Final audio: ${this.formatBytes(audio.size)} → ${this.formatBytes(processedAudio.size)}`);
            } catch (error) {
                console.error('Audio processing failed, using original:', error);
                formData.append('audio', audio);
                processedAudio = audio;
                stats.totalOriginalSize += audio.size;
                stats.totalCompressedSize += audio.size;
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
            audio_processed: !!processedAudio && processedAudio !== audio,
            estimated_size: this.formatBytes(stats.totalCompressedSize)
        }));

        stats.totalCompressionRatio = (stats.totalCompressedSize / stats.totalOriginalSize) * 100;

        return { formData, stats };
    }

    // Log compression results for monitoring
    static logCompressionStats(stats: CompressionStats): void {
        console.group(`📊 POST Compression Results`);
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

export default PostCompressionUtility;