import type { NextFunction, Request, Response } from "express"
import { redisCache } from "../config/redis.js"

export function cacheMiddleware(ttl: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const cacheKey = `cache:${req.originalUrl}`

        try {
            const cached = await redisCache.get(cacheKey)
            if (cached) {
                const { status, body } = JSON.parse(cached)
                return res.status(status).json(body)
            }
        } catch (err) {
            console.error("Cache read error:", err)
        }

        const originalJson = res.json.bind(res)
        res.json = (body: any) => {
            const status = res.statusCode
            if (status >= 200 && status < 300) {
                redisCache
                    .setex(cacheKey, ttl, JSON.stringify({ status, body }))
                    .catch((err) => console.error("Cache write error:", err))
            }
            return originalJson(body)
        }

        next()
    }
}
