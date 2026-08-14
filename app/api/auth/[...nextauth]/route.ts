import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import verifyToken from "@/lib/verifyToken";

type AuthCredentials = {
    email?: string;
    password?: string;
    endpoint?: string;
    payload?: string;
    token?: string;
};

const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                token: { label: "Token", type: "text" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials) return null;
                    const { email, password, endpoint, payload, token } = credentials as AuthCredentials;
                    if (token && !endpoint) {
                        const { data, error } = verifyToken(token);
                        if (!error && data) {
                            return {
                                ...data,
                                id: data.uid || data.userid || "verified-user",
                                token: token,
                            };
                        }
                        return null;
                    }

                    if (email && password) {
                        const cleanEmail = String(email).trim().toLowerCase();
                        const cleanPassword = String(password);
                        if (cleanEmail.length > 100 || cleanPassword.length > 64) { return null; }
                        const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
                        if (!user || !user.password) { return null; }
                        const isMatch = await bcrypt.compare(cleanPassword, user.password);
                        if (!isMatch) { return null; }
                        return {
                            id: String(user.id),
                            name: user.name,
                            email: user.email,
                        };
                    }
                    if (token && endpoint) {
                        let parsedBody;
                        try { parsedBody = JSON.parse(payload || "{}"); }
                        catch (e) { console.error("[NextAuth] Invalid payload JSON:", payload); return null; }
                        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API}/${endpoint}`;
                        const res = await fetch(apiUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify(parsedBody),
                            cache: "no-store",
                        });

                        if (!res.ok) return null;
                        const data = await res.json();

                        if (!data || data.StatusCode !== 200) return null;

                        return {
                            id: String(data.UID),
                            name: [data.FirstName, data.LastName || data.lastname]
                                .filter(Boolean)
                                .join(" ") || data.FirstName || null,
                            email: data.Email ?? null,
                            phone: data.Mobile ?? null,
                            userType: data.UserType ?? null,
                            token: data.Token,
                            successCode: data.StatusCode,
                            message: data.Message,
                        };
                    }

                    return null;
                } catch (error: any) {
                    console.error("[NextAuth Authorize Error]", error);
                    return null;
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                return { ...token, ...user };
            }
            return token;
        },

        async session({ session, token }) {
            (session as any).user = { ...token };
            return session;
        },
    },

    pages: {
        signIn: "/login",
        newUser: "/signup",
        error: "/login",
    },

    secret: process.env.NEXTAUTH_SECRET || "downloader-super-secret-key-2026",

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },

    logger: {
        error(code, metadata) {
            if (code === "JWT_SESSION_ERROR") return;
            console.error(code, metadata);
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };