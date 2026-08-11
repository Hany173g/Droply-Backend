import mongoose from "mongoose"
import { env } from "./env.js"
import logger from "../utils/logger.js"

const MAX_RETRIES = 5
const RETRY_INTERVAL_MS = 5000 // 5 seconds

let retries = 0

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.db.MONGODB_URL)
        // retries = 0; // reset on success
    } catch (error) {
        retries++
        logger.error(
            `MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}): ${error instanceof Error ? error.message : String(error)}`,
        )

        if (retries >= MAX_RETRIES) {
            logger.error("Max retries reached. Shutting down.")
            process.exit(1)
        }

        setTimeout(connectDB, RETRY_INTERVAL_MS) // recursion
    }
}

// Lost connection after initial connect
mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Attempting to reconnect...")
    setTimeout(connectDB, RETRY_INTERVAL_MS)
})

// Connection restored
mongoose.connection.on("reconnected", () => {})

// Clean up on app termination
process.on("SIGINT", async () => {
    await mongoose.connection.close()
    process.exit(0)
})
