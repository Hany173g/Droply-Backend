import type { Request, Response, NextFunction } from "express";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { createComment, deleteComment, getComments } from "./comment.service.js";

export const create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user
    let { targetId, targetType, content } = req.body
    let comment = await createComment(user.userId, targetId, targetType, content)
    let populated = await comment.populate("user", "name username photo")
    res.status(201).json({ success: true, comment: populated })
})

export const remove = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user
    let commentId = req.params.commentId as string
    await deleteComment(commentId, user.userId)
    res.status(200).json({ success: true, message: "Comment deleted" })
})

export const get = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let targetId = req.params.targetId as string
    let targetType = req.params.targetType as string
    let user = (req as any).user
    let comments = await getComments(targetId, targetType, user?.userId, req.query)
    res.status(200).json({ success: true, data: comments })
})
