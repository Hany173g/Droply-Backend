import { Redis as IORedis } from "ioredis"
import { env } from "./env.js"

export const redis = new IORedis({
    host: env.redis.REDIS_HOST,
    port: env.redis.REDIS_PORT,
    maxRetriesPerRequest: null,
})

export const redisCache = new IORedis({
    host: env.redis.REDIS_HOST,
    port: env.redis.REDIS_PORT,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        if (times > 3) return null
        return Math.min(times * 200, 2000)
    },
})

redis.on("error", (err) => {
    console.error("Redis connection error:", err.message)
})
