// utils/encodeDecode.ts
export function encodePostData<T>(data: T): string {
  try {
    const json = JSON.stringify(data);
    const compressed = btoa(encodeURIComponent(json)); // safe base64-ish
    return compressed;
  } catch (err) {
    console.error("Encoding failed", err);
    return "";
  }
}

export function decodePostData<T>(encoded: string): T | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as T;
  } catch (err) {
    console.error("Decoding failed", err);
    return null;
  }
}
