/**
 * Discovery — IP hashing & room code generation for peer grouping
 */

/** Generate a 6-digit numeric room code */
export function generateRoomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Validate a room code (6-digit numeric string) */
export function isValidRoomCode(code: string): boolean {
    return /^\d{6}$/.test(code);
}

/** Hash a string using SHA-256 and return the first 12 hex chars */
export async function hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex.slice(0, 12);
}

/** Fetch the user's hashed public IP from our own API route */
export async function getHashedIP(): Promise<string> {
    try {
        const res = await fetch("/api/ip");
        const data = await res.json();
        return data.hash as string;
    } catch {
        // Fallback: generate a random hash so the app still works
        return Math.random().toString(36).slice(2, 14);
    }
}

/** Generate a unique peer ID for this session (PeerJS-safe: alphanumeric + hyphen) */
export function generatePeerId(prefix: string): string {
    // Sanitize: only keep alphanumeric and hyphens
    const safe = prefix.replace(/[^a-zA-Z0-9-]/g, "");
    const random = Math.random().toString(36).slice(2, 8);
    const ts = Date.now().toString(36).slice(-4);
    return `${safe}-${random}${ts}`;
}

/** Device name / icon detection */
export interface DeviceInfo {
    name: string;
    type: "desktop" | "tablet" | "phone";
    os: string;
    browser: string;
}

export function detectDevice(): DeviceInfo {
    if (typeof navigator === "undefined") {
        return { name: "Unknown", type: "desktop", os: "Unknown", browser: "Unknown" };
    }

    const ua = navigator.userAgent;

    // OS detection — check mobile OS BEFORE desktop (Android UA contains "Linux", iPad contains "Mac")
    let os = "Unknown";
    if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPod/i.test(ua)) os = "iOS";
    else if (/iPad/i.test(ua)) os = "iPadOS";
    else if (/CrOS/i.test(ua)) os = "Chrome OS";
    else if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac/i.test(ua)) os = "macOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    // Browser detection
    let browser = "Unknown";
    if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/Chrome/i.test(ua)) browser = "Chrome";
    else if (/Firefox/i.test(ua)) browser = "Firefox";
    else if (/Safari/i.test(ua)) browser = "Safari";
    else if (/Opera|OPR/i.test(ua)) browser = "Opera";

    // Device type
    let type: DeviceInfo["type"] = "desktop";
    if (/Mobi/i.test(ua)) type = "phone";
    else if (/Tablet|iPad/i.test(ua)) type = "tablet";

    // Friendly name
    const name = `${browser} on ${os}`;

    return { name, type, os, browser };
}
