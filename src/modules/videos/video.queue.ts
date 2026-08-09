import { Worker, Queue } from "bullmq"
import { redis } from "../../config/redis.js"
import { uploadVideoAndTumbail, waitForEagerCompletion } from "./video.service.js"

export const videoQueue = new Queue("videoQueue", {
    connection: redis,
})
export const streamingQueue = new Queue("streamingQueue", {
    connection: redis,
})

const videoWorker = new Worker(
    "videoQueue",
    async (job) => {
        await uploadVideoAndTumbail(
            job.data.userId,
            job.data.filePath,
            job.data.hashVideo,
            job.data.userVideoId,
            job.data.tumbnailPath,
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
    console.error(`videoWorker job ${job?.id} failed:`, err.message)
})
