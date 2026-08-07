import { Worker, Queue } from "bullmq";
import { redis } from "../../config/redis.js";
import { createSingleNotification, handleNotificationData } from "./notification.service.js";

export const lightNotificationQueue = new Queue("lightNotificationQueue", {
    connection: redis
});

export const broadcastNotificationQueue = new Queue("broadcastNotificationQueue", {
    connection: redis
});

const lightWorker = new Worker("lightNotificationQueue", async (job) => {
    const { userId, fromUserId, type, targetId, likeType } = job.data;
    await createSingleNotification(userId, fromUserId, type, targetId, likeType);
}, {
    connection: redis,
    concurrency: 10
});

const broadcastWorker = new Worker("broadcastNotificationQueue", async (job) => {
    const { userId, fromUserId, type, targetId, likeType } = job.data;
    await handleNotificationData(userId, fromUserId, type, targetId, likeType);
}, {
    connection: redis,
    concurrency: 10
});

lightWorker.on("failed", (job, err) => {
    console.error(`Light notification job ${job?.id} failed:`, err.message);
});

broadcastWorker.on("failed", (job, err) => {
    console.error(`Broadcast notification job ${job?.id} failed:`, err.message);
});
