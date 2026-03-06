import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
    // Get client IP from Vercel's x-forwarded-for header or request headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "127.0.0.1";

    // Hash the IP for privacy
    const hash = createHash("sha256").update(ip).digest("hex").slice(0, 12);

    return NextResponse.json({ hash });
}
