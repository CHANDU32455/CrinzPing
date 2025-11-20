declare module '@ffmpeg/ffmpeg' {
  export class FFmpeg {
    load(): Promise<void>;
    writeFile(filename: string, data: Uint8Array): Promise<void>;
    readFile(filename: string): Promise<Uint8Array>;
    exec(args: string[]): Promise<void>;
    on(event: string, callback: (data: any) => void): void;
  }
}

declare module '@ffmpeg/util' {
  export function fetchFile(file: File | string): Promise<Uint8Array>;
}