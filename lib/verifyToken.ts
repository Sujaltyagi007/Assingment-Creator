import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "guest-secret-token-key-2026";

export default function verifyToken(token: string) {
    if (!JWT_SECRET) return { error: "Server configuration error: JWT_SECRET is not defined." };
    try {
        const decodedToken = jwt.verify(token, JWT_SECRET) as any;
        return { data: decodedToken };
    } catch (error: any) {
        if (error.name === "TokenExpiredError") return { error: "Token has expired. Please log in again." };
        else if (error.name === "JsonWebTokenError") return { error: "Invalid or malformed token. Please log in again." };
        else return { error: "An unexpected error occurred while verifying the token." };
    }
}