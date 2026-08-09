import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/ApiError.js"
import { env } from "../config/env.js"
import type { ITokenPayload } from "../modules/auth/auth.types.js"

export async function isUser(req: Request, res: Response, next: NextFunction) {
    try {
        let authorization = req.headers["authorization"]
        if (!authorization) {
            throw ApiError.badRequest("Missed authorization header")
        }
        let [schema, token] = authorization.split(" ")
        if (!token || schema !== "Bearer") {
            throw ApiError.unAuthorized("Invalid authorization header")
        }
        const payload = jwt.verify(token, env.jwt.JWT_SECRET) as ITokenPayload
        req.user = payload
        next()
    } catch (err: any) {
        if (err instanceof jwt.TokenExpiredError) {
            throw ApiError.unAuthorized("Token is expired")
        }
        if (err instanceof jwt.JsonWebTokenError) {
            throw ApiError.unAuthorized("Invalid token")
        }
        if (err instanceof ApiError) {
            throw err
        }
        throw ApiError.unAuthorized("Authentication failed")
    }
}
