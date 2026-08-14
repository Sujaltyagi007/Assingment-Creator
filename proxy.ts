import { NextRequest, NextResponse } from "next/server";
import verifyToken from "@/lib/verifyToken";

const EXEMPTED_ROUTES = [
    "/api/get-guest-token",
    "/api/auth",
];

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    if (!pathname.startsWith("/api")) { return NextResponse.next(); }

    const isExempted = EXEMPTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
    if (isExempted) { return NextResponse.next(); }

    const authHeader = req.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : req.headers.get("x-access-token") || req.nextUrl.searchParams.get("token");

    if (token) { token = token.trim().replace(/^["']|["']$/g, ""); }
    if (!token) {
        return NextResponse.json(
            { error: "Access denied. Authentication token missing in request." },
            { status: 401 }
        );
    }

    const { data, error } = verifyToken(token);
    if (error) {
        return NextResponse.json(
            { error: error || "Invalid or expired token." },
            { status: 401 }
        );
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-data", JSON.stringify(data));

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ["/api/:path*"] };