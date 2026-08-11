import app from "./app.js"
import { env } from "./config/env.js"
import { connectDB } from "./config/database.js"
import { redis } from "./config/redis.js"
import logger from "./utils/logger.js"

async function startServer() {
    try {
        await connectDB()
        await redis.ping()
        const server = app.listen(env.app.PORT, () => {
            logger.info(`Server running on port ${env.app.PORT}`)
        })

        process.on("unhandledRejection", (err) => {
            logger.error("UNHANDLED REJECTION:", err)
            server.close(() => process.exit(1))
        })

        process.on("uncaughtException", (err) => {
            logger.error("UNCAUGHT EXCEPTION:", err)
            process.exit(1)
        })
    } catch (err) {
        logger.error("Failed to start:", err)
        process.exit(1)
    }
}

startServer()
