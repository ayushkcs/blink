import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
    // Get client IP from reverse proxy headers (Vercel, Nginx, etc.)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    let ip = forwarded?.split(",")[0]?.trim() ?? realIp ?? "";

    // If no proxy header (local dev), fetch the actual public IP
    // so all devices behind the same router get the same hash
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
        try {
            const res = await fetch("https://api.ipify.org?format=json", {
                signal: AbortSignal.timeout(3000),
            });
            const data = await res.json();
            ip = data.ip ?? "fallback";
        } catch {
            // If ipify fails, use a stable fallback so local devices still match
            ip = "local-network";
        }
    }

    // Hash the IP for privacy
    const hash = createHash("sha256").update(ip).digest("hex").slice(0, 12);

    return NextResponse.json({ hash });
}
