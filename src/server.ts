import app from "./app.js"
import { env } from "./config/env.js"
import { connectDB } from "./config/database.js"
import { redis } from "./config/redis.js"

async function startServer() {
    try {
        await connectDB()
        await redis.ping()
        app.listen(env.app.PORT, () => {})
    } catch (err) {
        console.error("Failed to start:", err)
        process.exit(1)
    }
}

startServer()
