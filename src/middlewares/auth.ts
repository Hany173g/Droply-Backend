import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { env } from "../config/env.js"
import type { ITokenPayload } from "../modules/auth/auth.types.js"

export const protect = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header || !header.startsWith("Bearer ")) {
        return next(ApiError.unAuthorized("Not authenticated. Please login."))
    }

    const token = header.split(" ")[1]
    if (!token) {
        return next(ApiError.unAuthorized("Not authenticated. Please login."))
    }

    try {
        const decoded = jwt.verify(token, env.jwt.JWT_SECRET) as ITokenPayload
        ;(req as any).user = decoded
        next()
    } catch {
        return next(ApiError.unAuthorized("Invalid or expired token."))
    }
}
