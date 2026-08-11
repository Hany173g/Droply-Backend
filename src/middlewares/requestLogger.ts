import type { Request, Response, NextFunction } from "express"
import logger from "../utils/logger.js"

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now()

    res.on("finish", () => {
        const duration = Date.now() - start
        const log = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
        }

        if (res.statusCode >= 400) {
            logger.warn("Request failed", log)
        } else {
            logger.info("Request completed", log)
        }
    })

    next()
}
