import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { JWT_SECRET } from "@/lib/verifyToken";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const uid = randomUUID();
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
        const useragent = req.headers.get("user-agent") || "Mozilla/5.0";
        const now = new Date();
        const tokenExpDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const basePayload = {
            email: "",
            name: "Guest User",
            phonecode: "",
            phone: 0,
            userid: "",
            uid: uid,
            isTemporary: true,
            token: "",
            parentid: "",
            ip: ip,
            useragent: useragent,
            usertype: "customer",
        };

        const token = jwt.sign({
            ...basePayload,
            tokentype: "access_token",
        }, JWT_SECRET, { expiresIn: "30d" });

        const responseObj = {
            UserName: "Guest",
            Status: 0,
            Token: token,
            TokenExpAt: tokenExpDate.toISOString(),
        };

        const guestUser = await prisma.user.create({
            data: {
                name: "Guest User",
                email: `guest-${uid}@guest.local`,
                token: token,
                isGuest: true,
            },
        });

        return NextResponse.json(responseObj);
    } catch (error: any) {
        console.error("[GUEST_TOKEN_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to generate guest token." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    return GET(req);
}