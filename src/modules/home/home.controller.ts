import type { Request, Response, NextFunction } from "express"
import asyncHandler from "../../middlewares/asyncHandler.js"
import { getHomeFeed, getShorts } from "./home.service.js"

export const homeFeed = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let page = Number(req.query.page) || 1
    let limit = Number(req.query.limit) || 20
    let user = (req as any).user
    let acceptLanguage = req.headers["accept-language"]
    let videos = await getHomeFeed(page, limit, acceptLanguage, user?.userId)
    res.status(200).json({ success: true, data: videos })
})

export const shorts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let page = Number(req.query.page) || 1
    let limit = Number(req.query.limit) || 20
    let user = (req as any).user
    let acceptLanguage = req.headers["accept-language"]
    let videos = await getShorts(page, limit, acceptLanguage, user?.userId)
    res.status(200).json({ success: true, data: videos })
})
