import Notification from "./notification.model.js"
import { ApiError } from "../../utils/ApiError.js"
import User from "../user/models/user.model.js"
import type { notificationType } from "./notification.types.js"
import { getChannelSubscription } from "../channel/channel.service.js"
import { checkUserVideoFound } from "../videos/video.service.js"
import { Types } from "mongoose"
import { ApiFeatures } from "../../utils/ApiFeatures.js"

export async function getNotificationsByUser(userId: string, queryString: Record<string, any>) {
    let baseQuery = Notification.find({ userId })
    let features = new ApiFeatures(baseQuery, queryString).sort().pagination()

    let [notifications, unreadCount, total] = await Promise.all([
        features.query
            .populate("fromUserId", "name username photo")
            .populate("targetId", "title thumbnail slug type views")
            .lean(),
        Notification.countDocuments({ userId, isRead: false }),
        Notification.countDocuments({ userId }),
    ])
    return { notifications, unreadCount, total }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
    let notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { $set: { isRead: true } },
        { new: true },
    )
    if (!notification) throw ApiError.notFound("Notification not found")
    return notification
}

export async function markAllNotificationsAsRead(userId: string) {
    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } })
}

export async function deleteNotificationById(notificationId: string, userId: string) {
    let notification = await Notification.findOneAndDelete({ _id: notificationId, userId })
    if (!notification) throw ApiError.notFound("Notification not found")
}

export async function createNotifications(
    data: {
        userId: Types.ObjectId
        fromUserId: Types.ObjectId
        type: notificationType
        targetId?: Types.ObjectId
        message: string
    }[],
) {
    let docs = data
        .filter((d) => d.userId.toString() !== d.fromUserId.toString())
        .map((d) => {
            let doc: Record<string, any> = {
                userId: d.userId,
                fromUserId: d.fromUserId,
                type: d.type,
                message: d.message,
            }
            if (d.targetId) doc.targetId = d.targetId
            return doc
        })
    if (docs.length === 0) return []
    await Notification.insertMany(docs)
}

export async function deleteReadNotifications(userId: string) {
    await Notification.deleteMany({ userId, isRead: true })
}

export async function buildNotificationMessage(
    fromUserId: string,
    type: notificationType,
    likeType?: string,
): Promise<string | null> {
    let userAction = await User.findById(fromUserId).select("name").lean()
    if (!userAction) return null

    let messageMap = new Map<notificationType, string>([
        ["like", `${userAction.name} liked your ${likeType}`],
        ["comment", `${userAction.name} commented on your video`],
        ["subscribe", `${userAction.name} subscribed to your channel`],
        ["mention", `${userAction.name} mentioned you`],
        ["newVideo", `${userAction.name} uploaded a new video`],
    ])
    return messageMap.get(type) || null
}

export async function createSingleNotification(
    userId: string,
    fromUserId: string,
    type: notificationType,
    targetId?: string,
    likeType?: string,
) {
    let message = await buildNotificationMessage(fromUserId, type, likeType)
    if (!message) return

    await createNotifications([
        {
            userId: new Types.ObjectId(userId),
            fromUserId: new Types.ObjectId(fromUserId),
            type,
            ...(targetId ? { targetId: new Types.ObjectId(targetId) } : {}),
            message,
        },
    ])
}

export async function handleNotificationData(
    userId: Types.ObjectId,
    fromUserId: Types.ObjectId,
    type: notificationType,
    targetId: string,
    likeType?: string,
) {
    let message = await buildNotificationMessage(fromUserId.toString(), type, likeType)
    if (!message) return

    let data: {
        userId: Types.ObjectId
        fromUserId: Types.ObjectId
        type: notificationType
        targetId?: Types.ObjectId
        message: string
    }[] = []

    if (type === "newVideo") {
        let video = await checkUserVideoFound(targetId)
        if (video.channelId) {
            let subscriptions = await getChannelSubscription(video.channelId, true)
            for await (const s of subscriptions) {
                data.push({
                    userId: s.subscriber,
                    fromUserId,
                    type,
                    targetId: video._id,
                    message,
                })
                if (data.length >= 5000) {
                    await createNotifications(data)
                    data = []
                }
            }
        }
    } else {
        let video = type === "subscribe" ? null : await checkUserVideoFound(targetId)
        data.push({
            userId,
            fromUserId,
            type,
            ...(video ? { targetId: video._id } : {}),
            message,
        })
    }
    await createNotifications(data)
}
