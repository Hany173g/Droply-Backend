import Comment from "./comment.model.js"
import { ApiError } from "../../utils/ApiError.js"
import { getTargetModel } from "../../utils/findTarget.js"
import mongoose, { Types } from "mongoose"
import { hasUserLikedMany as hasUserLiked } from "../like/like.service.js"
import { lightNotificationQueue } from "../notification/notification.queue.js"
import { ApiFeatures } from "../../utils/ApiFeatures.js"

export async function createComment(
    userId: string,
    targetId: string,
    targetType: string,
    content: string,
) {
    const session = await mongoose.startSession()
    try {
        await session.startTransaction()
        let Model = getTargetModel(targetType)
        let target = await Model.findById(targetId).session(session)
        if (!target) throw ApiError.notFound(`${targetType} not found`)
        const comment = new Comment({
            user: new Types.ObjectId(userId),
            targetId,
            targetType,
            content,
        })
        await comment.save({ session })
        await Model.updateOne({ _id: targetId }, { $inc: { commentsCount: 1 } }, { session })
        await session.commitTransaction()
        let ownerUserId = target.userId
        if (ownerUserId) {
            lightNotificationQueue.add("notification", {
                userId: ownerUserId.toString(),
                fromUserId: userId,
                type: "comment",
                targetId: targetId,
            })
        }
        return comment
    } catch (err) {
        await session.abortTransaction()
        console.error("createComment error:", err)
        throw err
    } finally {
        await session.endSession()
    }
}

export async function deleteComment(commentId: string, userId: string) {
    const session = await mongoose.startSession()
    try {
        await session.startTransaction()
        let comment = await Comment.findById(commentId).session(session)
        if (!comment) throw ApiError.notFound("Comment not found")
        if (comment.user.toString() !== userId)
            throw ApiError.forbidden("You can only delete your own comments")
        await getTargetModel(comment.targetType).updateOne(
            { _id: comment.targetId },
            { $inc: { commentsCount: -1 } },
            { session },
        )
        await comment.deleteOne({ session })
        await session.commitTransaction()
    } catch (err) {
        await session.abortTransaction()
        throw err
    } finally {
        await session.endSession()
    }
}

export async function getComments(
    targetId: string,
    targetType: string,
    userId?: string,
    queryString?: Record<string, any>,
) {
    let baseQuery = Comment.find({ targetId, targetType })
    let features = new ApiFeatures(baseQuery, queryString || {}).sort().pagination()

    let comments = await features.query.populate("user", "name username photo").lean()
    let commentsIds = comments.map((comment) => {
        return comment._id
    })
    if (userId) {
        let isLikes = await hasUserLiked(userId, commentsIds, "comment")
        isLikes.map((like) =>
            comments.map((comment) => {
                if (comment._id == like.targetId) {
                    comment.action = { isLike: true, type: like.type }
                }
            }),
        )
    }
    return comments
}
