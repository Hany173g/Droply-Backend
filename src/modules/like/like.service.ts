import Like from "./like.model.js"
import { getTargetModel } from "../../utils/findTarget.js"
import mongoose from "mongoose"
import {Types} from "mongoose"
import { lightNotificationQueue } from "../notification/notification.queue.js"
export async function toggleLike(userId: string, targetId: string, targetType: string, type: "like" | "dislike" = "like"): Promise<"liked" | "unliked"> {
    const session = await mongoose.startSession();
    try {
        await session.startTransaction();
        let existing = await Like.findOne({ user: userId, targetId, targetType }).session(session)
        let Model = getTargetModel(targetType)

        if (existing) {
            if (existing.type === type) {
                await existing.deleteOne({ session })
                await Model.updateOne(
                    { _id: targetId },
                    { $inc: type === "like" ? { likesCount: -1 } : { dislikesCount: -1 } },
                    { session }
                )
                await session.commitTransaction();
                return "unliked"
            }
            let oldType = existing.type
            existing.type = type
            await existing.save({ session })
            let updates: Record<string, any> = {}
            if (oldType === "like") updates.likesCount = -1
            else updates.dislikesCount = -1
            if (type === "like") updates.likesCount = 1
            else updates.dislikesCount = 1
            await Model.updateOne(
                { _id: targetId },
                { $inc: updates },
                { session }
            )
            await session.commitTransaction();

            if (type === "like") {
                let target = await Model.findById(targetId).select("userId user").lean();
                let ownerUserId = targetType === "video" ? target?.userId : target?.user;
                if (ownerUserId) {
                    lightNotificationQueue.add("notification", {
                        userId: ownerUserId.toString(),
                        fromUserId: userId,
                        type: "like",
                        targetId: targetId,
                        likeType: targetType
                    });
                }
            }

            return "liked"
        }

        await new Like({ user: userId, targetId, targetType, type }).save({ session })
        await Model.updateOne(
            { _id: targetId },
            { $inc: type === "like" ? { likesCount: 1 } : { dislikesCount: 1 } },
            { session }
        )
        await session.commitTransaction();

        if (type === "like") {
            let target = await Model.findById(targetId).select("userId user").lean();
            let ownerUserId = targetType === "video" ? target?.userId : target?.user;
            if (ownerUserId) {
                lightNotificationQueue.add("notification", {
                    userId: ownerUserId.toString(),
                    fromUserId: userId,
                    type: "like",
                    targetId: targetId,
                    likeType: targetType
                });
            }
        }

        return "liked"
    } catch (err) {
        await session.abortTransaction();
        throw err
    } finally {
        await session.endSession();
    }
}


export async function hasUserLiked(userId: string, targetId: string, targetType: string): Promise<"like" | "dislike" | null> {
    let like = await Like.findOne({ user: userId, targetId, targetType })
    return like ? like.type : null
}

export async function hasUserLikedMany(userId: string, targetsId: Types.ObjectId[], targetType: string) {
    let likes = await Like.find({
        user: userId,
        targetId: { $in: targetsId },
        targetType
    }).select("targetId type")
    return likes
}