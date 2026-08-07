import type { Request, Response, NextFunction } from "express";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { toggleLike, hasUserLiked } from "./like.service.js";

export const toggle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user
    let { targetId, targetType, type } = req.body
    let action = await toggleLike(user.userId, targetId, targetType, type || "like")
    res.status(200).json({ success: true, action })
})

export const check = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user
    let targetId = req.params.targetId as string
    let targetType = req.params.targetType as string
    let liked = await hasUserLiked(user.userId, targetId, targetType)
    res.status(200).json({ success: true, liked })
})
