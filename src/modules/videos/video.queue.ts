import { Worker, Queue } from "bullmq"
import { redis } from "../../config/redis.js"
import { uploadVideoAndThumbnail, waitForEagerCompletion } from "./video.service.js"
import logger from "../../utils/logger.js"

export const videoQueue = new Queue("videoQueue", {
    connection: redis,
})
export const streamingQueue = new Queue("streamingQueue", {
    connection: redis,
})

const videoWorker = new Worker(
    "videoQueue",
    async (job) => {
        await uploadVideoAndThumbnail(
            job.data.userId,
            job.data.filePath,
            job.data.hashVideo,
            job.data.userVideoId,
            job.data.thumbnailPath,
            job,
        )
    },
    {
        connection: redis,
        concurrency: 3,
    },
)

const streamingWorker = new Worker(
    "streamingQueue",
    async (job) => {
        await waitForEagerCompletion(
            job.data.publicId,
            job.data.videoId,
            job.data.backOffDelay,
            job,
        )
    },
    {
        connection: redis,
        concurrency: 10,
    },
)
videoWorker.on("failed", (job, err) => {
    logger.error(`videoWorker job ${job?.id} failed:`, err.message)
})
