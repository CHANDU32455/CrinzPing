// types/global.d.ts
interface HTMLVideoElement {
    captureStream(frameRate?: number): MediaStream;
}

interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
}
