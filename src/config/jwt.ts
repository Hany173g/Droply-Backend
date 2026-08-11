import type { SignOptions } from "jsonwebtoken"
import { env } from "./env.js"

export const accessTokenConfig = {
    secret: env.jwt.JWT_SECRET,
    expiresIn: "1h" as NonNullable<SignOptions["expiresIn"]>, // Skip typescript validation
}

export const refreshTokenConfig = {
    secret: env.jwt.REFRESH_TOKEN_SECRET,
    expiresIn: "7d" as NonNullable<SignOptions["expiresIn"]>, // Skip typescript validation
}
