import { Types } from "mongoose";


export type notificationType = "like" | "comment" | "subscribe" | "mention" | "newVideo"

export interface INotification {
    userId: Types.ObjectId;
    fromUserId: Types.ObjectId;
    type: notificationType
    targetId: Types.ObjectId;
    message: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}
