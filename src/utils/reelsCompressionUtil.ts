// utils/reelsCompressionUtil.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export interface CompressionResult {
  file: File;
  originalSize: number;
  processedSize: number;
  timeTaken: number;
  quality: number;
  resolution: string;
}

interface CompressionPreset {
  videoCodec: string;
  preset: string;
  crf: string;
  audioBitrate: string;
  scale: string;
  threads: string;
}

interface DeviceCapabilities {
  threads: number;
  isMobile: boolean;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

export class VideoCompressionUtility {
  private static MAX_TARGET_SIZE = 8 * 1024 * 1024;
  private static TARGET_DURATION = 30; // Always trim to 30 seconds
  private static ffmpeg: FFmpeg | null = null;
  private static isLoaded = false;

  // 🚀 OPTIMIZATION: Pre-optimized presets with better threading
  private static readonly COMPRESSION_PRESETS: Record<string, CompressionPreset> = {
    fast: {
      videoCodec: 'libx264',
      preset: 'ultrafast',
      crf: '24',
      audioBitrate: '128k',
      scale: '1280:720',
      threads: '4'
    },
    balanced: {
      videoCodec: 'libx264',
      preset: 'fast',
      crf: '23',
      audioBitrate: '160k',
      scale: '1920:1080',
      threads: '4'
    },
    quality: {
      videoCodec: 'libx264',
      preset: 'medium',
      crf: '20',
      audioBitrate: '192k',
      scale: '1920:1080',
      threads: '2'
    },
    mobile: {
      videoCodec: 'libx264',
      preset: 'ultrafast',
      crf: '26',
      audioBitrate: '128k',
      scale: '1280:720',
      threads: '2'
    }
  };

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 🚀 Detect device capabilities for optimal performance
  private static detectDeviceCapabilities(): DeviceCapabilities {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 2; // Fallback to 2 cores

    // Mobile devices: be conservative with threads
    if (isMobile) {
      return {
        threads: Math.min(2, Math.floor(cores / 2)), // Use half available cores on mobile
        isMobile: true
      };
    }

    // Desktop: more aggressive threading
    return {
      threads: Math.min(6, Math.floor(cores * 0.75)), // Use 75% of available cores
      isMobile: false
    };
  }

  static async loadFFmpeg(): Promise<void> {
    if (this.isLoaded) return;

    try {
      this.ffmpeg = new FFmpeg();

      // Use CDN for reliability
      const ffmpegAny = this.ffmpeg as unknown as Record<string, unknown>;
      ffmpegAny.coreURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js';
      ffmpegAny.wasmURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm';

      await this.ffmpeg.load();
      this.isLoaded = true;
    } catch (error) {
      throw new Error(`Failed to load FFmpeg: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🚀 COMPLETELY SAFE Uint8Array TO BLOB CONVERSION
  private static safeUint8ArrayToBlob(data: Uint8Array, type: string): Blob {
    return new Blob([data as BlobPart], { type });
  }

  // 🚀 MAIN OPTIMIZED COMPRESSION METHOD - ENSURES 30s TRIM
  static async compressVideo(
    file: File,
    onProgress?: (progress: number) => void,
    preset: string = 'balanced'
  ): Promise<CompressionResult> {
    const startTime = performance.now();

    try {
      await this.loadFFmpeg();
      if (!this.ffmpeg) throw new Error('FFmpeg failed to load');

      // 🚀 Detect device capabilities for optimal performance
      const deviceInfo = this.detectDeviceCapabilities();

      // 🚀 Quick metadata extraction
      const { duration, width, height } = await this.getQuickVideoMetadata(file);
      const originalSize = file.size;

      // 🚀 CRITICAL: ALWAYS trim to 30 seconds maximum
      const targetDuration = Math.min(duration, this.TARGET_DURATION);

      // 🚀 Smart preset selection with device awareness
      const selectedPreset = this.autoSelectPreset(duration, originalSize, preset, deviceInfo);

      // Set up progress monitoring
      this.setupProgressMonitoring(onProgress);

      // Write input file
      const inputData = await fetchFile(file);
      await this.ffmpeg.writeFile('input.mp4', inputData);

      // 🚀 Build optimized FFmpeg command with device-aware threading
      const args = this.buildOptimizedCommand(targetDuration, selectedPreset, originalSize, duration, deviceInfo);

      // Execute compression
      await this.ffmpeg.exec(args);

      // Read output
      const data = await this.ffmpeg.readFile('output.mp4');

      // 🚀 FIX: Use safe conversion method with type assertion
      const compressedBlob = this.safeUint8ArrayToBlob(data as Uint8Array, 'video/mp4');
      const compressedFile = new File([compressedBlob], `compressed-${file.name}`, {
        type: 'video/mp4'
      });

      const processedSize = compressedFile.size;
      const timeTaken = performance.now() - startTime;
      const quality = this.calculateQuality(originalSize, processedSize);
      const resolution = this.getResolution(width, height);

      const result: CompressionResult = {
        file: compressedFile,
        originalSize,
        processedSize,
        timeTaken,
        quality,
        resolution
      };

      // Cleanup
      await this.cleanupFiles(['input.mp4', 'output.mp4']);

      onProgress?.(100);
      return result;

    } catch (error) {
      await this.cleanupFiles(['input.mp4', 'output.mp4']);
      throw error instanceof Error ? error : new Error('Compression failed');
    }
  }

  // 🚀 Quick metadata extraction with timeout
  private static async getQuickVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      let metadataLoaded = false;

      const loadTimeout = setTimeout(() => {
        if (!metadataLoaded) {
          URL.revokeObjectURL(url);
          resolve({
            duration: 60,
            width: 1280,
            height: 720
          });
        }
      }, 2000);

      video.addEventListener('loadedmetadata', () => {
        metadataLoaded = true;
        clearTimeout(loadTimeout);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
        URL.revokeObjectURL(url);
      });

      video.addEventListener('error', () => {
        clearTimeout(loadTimeout);
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      });

      video.src = url;
      video.load();
    });
  }

  // 🚀 Smart preset selection with device awareness
  private static autoSelectPreset(
    duration: number,
    size: number,
    requestedPreset: string,
    deviceInfo: DeviceCapabilities
  ): CompressionPreset {

    // 🚀 Mobile devices: use mobile-optimized preset
    if (deviceInfo.isMobile) {
      return this.COMPRESSION_PRESETS.mobile;
    }

    // 🚀 Very long videos: use fastest preset
    if (duration > 120) {
      return { ...this.COMPRESSION_PRESETS.fast, threads: deviceInfo.threads.toString() };
    }

    // 🚀 Large files: use balanced approach
    if (size > 50 * 1024 * 1024) {
      return { ...this.COMPRESSION_PRESETS.balanced, threads: deviceInfo.threads.toString() };
    }

    const basePreset = this.COMPRESSION_PRESETS[requestedPreset] || this.COMPRESSION_PRESETS.balanced;

    // 🚀 Override threads based on device capabilities
    return { ...basePreset, threads: deviceInfo.threads.toString() };
  }

  // 🚀 Optimized FFmpeg command building with dynamic threading
  private static buildOptimizedCommand(
    targetDuration: number,
    preset: CompressionPreset,
    originalSize: number,
    originalDuration: number,
    deviceInfo: DeviceCapabilities
  ): string[] {
    // 🚀 CRITICAL: Always include -t parameter to ensure 30s max
    const args = [
      '-i', 'input.mp4',
      '-t', targetDuration.toString(), // This ensures trimming to max 30s
      '-c:v', preset.videoCodec,
      '-preset', preset.preset,
      '-crf', preset.crf,
      '-vf', `scale=${preset.scale}:flags=fast_bilinear`,
      '-c:a', 'aac',
      '-b:a', preset.audioBitrate,
      '-movflags', '+faststart',
      '-threads', preset.threads, // 🚀 Dynamic threading based on device
      '-y',
      'output.mp4'
    ];

    // 🚀 Additional optimizations for mobile
    if (deviceInfo.isMobile) {
      args.push('-cpu-used', '0'); // Optimize for mobile CPU
    }

    // For very large files, add seek to start for faster processing
    if (originalSize > 100 * 1024 * 1024) {
      args.splice(2, 0, '-ss', '0');
    }

    // For very long videos, use faster encoding
    if (originalDuration > 180) {
      const fasterIndex = args.indexOf('-preset');
      if (fasterIndex !== -1) {
        args[fasterIndex + 1] = 'ultrafast';
      }
    }

    return args;
  }

  private static setupProgressMonitoring(onProgress?: (progress: number) => void): void {
    if (!this.ffmpeg) return;

    this.ffmpeg.on('progress', (event) => {
      if (event.progress && typeof event.progress === 'number') {
        const percent = Math.min(event.progress * 100, 95);
        onProgress?.(percent);
      }
    });
  }

  // 🚀 ULTRA-FAST TRIM-ONLY FUNCTION - ENSURES 30s
  static async fastTrim(file: File, onProgress?: (progress: number) => void): Promise<CompressionResult> {
    const startTime = performance.now();

    try {
      await this.loadFFmpeg();
      if (!this.ffmpeg) throw new Error('FFmpeg failed to load');

      const { duration } = await this.getQuickVideoMetadata(file);

      // 🚀 CRITICAL: Always trim to 30 seconds max
      const targetDuration = Math.min(duration, this.TARGET_DURATION);

      this.setupProgressMonitoring(onProgress);

      const inputData = await fetchFile(file);
      await this.ffmpeg.writeFile('input.mp4', inputData);

      // 🚀 Stream copy - fastest possible trim (no re-encoding)
      await this.ffmpeg.exec([
        '-i', 'input.mp4',
        '-t', targetDuration.toString(), // This ensures 30s max
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
        '-threads', '4', // 🚀 More threads for faster file operations
        '-y',
        'output.mp4'
      ]);

      const data = await this.ffmpeg.readFile('output.mp4');

      // 🚀 FIX: Use safe conversion method with type assertion
      const trimmedBlob = this.safeUint8ArrayToBlob(data as Uint8Array, 'video/mp4');
      const trimmedFile = new File([trimmedBlob], `trimmed-${file.name}`, {
        type: 'video/mp4'
      });

      const result: CompressionResult = {
        file: trimmedFile,
        originalSize: file.size,
        processedSize: trimmedFile.size,
        timeTaken: performance.now() - startTime,
        quality: 95,
        resolution: 'original'
      };

      await this.cleanupFiles(['input.mp4', 'output.mp4']);

      return result;

    } catch (error) {
      await this.cleanupFiles(['input.mp4', 'output.mp4']);
      throw error instanceof Error ? error : new Error('Trimming failed');
    }
  }

  // 🚀 SMART COMPRESSION DECISION MAKER - ENSURES 30s TRIM
  static async smartCompress(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<CompressionResult> {
    const { duration, width, height } = await this.getQuickVideoMetadata(file);

    // 🚀 Detect device for optimal preset selection
    const deviceInfo = this.detectDeviceCapabilities();

    // Decision tree for optimal approach - ALL PATHS ENSURE 30s MAX
    if (file.size <= this.MAX_TARGET_SIZE && duration <= this.TARGET_DURATION) {
      return {
        file,
        originalSize: file.size,
        processedSize: file.size,
        timeTaken: 0,
        quality: 100,
        resolution: this.getResolution(width, height)
      };
    }

    if (file.size <= this.MAX_TARGET_SIZE && duration > this.TARGET_DURATION) {
      return this.fastTrim(file, onProgress);
    }

    // 🚀 Device-aware preset selection
    let preset: string = 'balanced';

    if (deviceInfo.isMobile) {
      preset = 'mobile';
    } else if (duration > 120) {
      preset = 'fast';
    } else if (file.size > 100 * 1024 * 1024) {
      preset = 'balanced';
    } else {
      preset = 'quality';
    }

    return this.compressVideo(file, onProgress, preset);
  }

  // 🚀 FORCE TRIM ANY VIDEO TO 30s (for cases where you want to ensure trimming)
  static async forceTrimTo30s(file: File, onProgress?: (progress: number) => void): Promise<CompressionResult> {
    const { duration } = await this.getQuickVideoMetadata(file);

    if (duration <= this.TARGET_DURATION) {
      return {
        file,
        originalSize: file.size,
        processedSize: file.size,
        timeTaken: 0,
        quality: 100,
        resolution: 'original'
      };
    }

    return this.fastTrim(file, onProgress);
  }

  private static getResolution(width: number, height: number): string {
    if (width >= 1920 || height >= 1080) return '1080p';
    if (width >= 1280 || height >= 720) return '720p';
    if (width >= 854 || height >= 480) return '480p';
    return '360p';
  }

  private static calculateQuality(originalSize: number, processedSize: number): number {
    const compressionRatio = processedSize / originalSize;
    return Math.max(50, Math.min(95, 100 - (compressionRatio * 50)));
  }

  private static async cleanupFiles(filenames: string[]): Promise<void> {
    if (!this.ffmpeg) return;

    for (const filename of filenames) {
      try {
        const ffmpegAny = this.ffmpeg as unknown as { deleteFile?: (filename: string) => Promise<void> };
        if (ffmpegAny.deleteFile) {
          await ffmpegAny.deleteFile(filename);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  // Clean up FFmpeg instance
  static async cleanup(): Promise<void> {
    if (this.ffmpeg) {
      try {
        this.ffmpeg = null;
        this.isLoaded = false;
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}