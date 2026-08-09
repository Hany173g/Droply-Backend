import mongoose from "mongoose"
import { env } from "./env.js"

const MAX_RETRIES = 5
const RETRY_INTERVAL_MS = 5000 // 5 seconds

let retries = 0

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.db.MONGODB_URL)
        console.log(` MongoDB connected: ${conn.connection.host}`)
        // retries = 0; // reset on success
    } catch (error) {
        retries++
        console.error(
            ` MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}): ${error instanceof Error ? error.message : String(error)}`,
        )

        if (retries >= MAX_RETRIES) {
            console.error(" Max retries reached. Shutting down.")
            process.exit(1)
        }

        console.log(` Retrying in ${RETRY_INTERVAL_MS / 1000}s...`)
        setTimeout(connectDB, RETRY_INTERVAL_MS) // recursion
    }
}

// Lost connection after initial connect
mongoose.connection.on("disconnected", () => {
    console.warn(" MongoDB disconnected. Attempting to reconnect...")
    setTimeout(connectDB, RETRY_INTERVAL_MS)
})

// Connection restored
mongoose.connection.on("reconnected", () => {
    console.log(" MongoDB reconnected.")
})

// Clean up on app termination
process.on("SIGINT", async () => {
    await mongoose.connection.close()
    console.log("🔌 MongoDB connection closed.")
    process.exit(0)
})
