import pako from "pako";

// --- helpers ---
function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, ""); // strip padding
}

function fromBase64Url(base64: string): Uint8Array {
  const padded =
    base64.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((base64.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- main encode ---
export function encodePostData<T>(data: T): string {
  try {
    const json = JSON.stringify(data);
    const compressed = pako.deflate(json); // Uint8Array
    return toBase64Url(compressed);
  } catch (err) {
    console.error("Encoding failed", err);
    return "";
  }
}

// --- main decode ---
export function decodePostData<T>(encoded: string): T | null {
  try {
    // compressed format
    const bytes = fromBase64Url(encoded);
    const decompressed = pako.inflate(bytes, { to: "string" });
    return JSON.parse(decompressed) as T;
  } catch {
    try {
      // fallback for old non-compressed links
      const decoded = decodeURIComponent(encoded);
      return JSON.parse(decoded) as T;
    } catch (err2) {
      console.error("Decoding failed", err2);
      return null;
    }
  }
}
