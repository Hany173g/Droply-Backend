import mongoose, { Types } from "mongoose"
import type { INotification, notificationType } from "./notification.types.js"
const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: "Users",
            required: true,
        },
        fromUserId: {
            type: Types.ObjectId,
            ref: "Users",
            required: true,
        },
        type: {
            type: String,
            enum: ["like", "comment", "subscribe", "mention", "newVideo"],
            required: true,
        },
        targetId: {
            type: Types.ObjectId,
            ref: "UserVideo",
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
)

notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, isRead: 1 })

// Auto-delete read notifications after 24 hours
notificationSchema.index(
    { updatedAt: 1 },
    { expireAfterSeconds: 24 * 60 * 60, partialFilterExpression: { isRead: true } },
)

const Notification = mongoose.model<INotification>("Notification", notificationSchema)
export default Notification
