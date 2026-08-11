import type { Request, Response, NextFunction } from "express"
import asyncHandler from "../../middlewares/asyncHandler.js"
import {
    createVideoFlow,
    getUserVideos,
    getPublicUserVideos,
    getUserVideo,
    updateVideoStatus,
    refreshSignedUrl,
    searchVideos,
} from "./video.service.js"
import cloudinary from "../../config/cloudinary.js"
export const uploadVideo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user
    let data = req.body
    const files = req.files as { [key: string]: Express.Multer.File[] }
    let videoFile = files?.video?.[0]
    let thumbnailFile = files?.thumbnail?.[0]
    if (!videoFile) {
        res.status(400).json({ success: false, message: "Please upload a video" })
        return
    }
    if (!thumbnailFile) {
        res.status(400).json({ success: false, message: "Please upload a thumbnail" })
        return
    }
    await createVideoFlow(data, user.userId, videoFile, thumbnailFile)
    res.status(201).json({ success: true, message: "Video upload started" })
})

export const getMyVideos = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user
    let result = await getUserVideos(user.userId)
    res.status(200).json({ success: true, data: result })
})

export const getPublicVideos = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        let username = req.params.username as string
        let result = await getPublicUserVideos(username)
        res.status(200).json({ success: true, data: result })
    },
)

export const getSingleVideo = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        let videoId = req.params.videoId as string
        let user = (req as any).user
        let result = await getUserVideo(videoId, user?.userId)
        res.status(200).json({ success: true, data: result })
    },
)

export const updateStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        let user = (req as any).user
        let videoId = req.params.videoId as string
        let { status } = req.body
        let result = await updateVideoStatus(videoId, user.userId, status)
        res.status(200).json({ success: true, data: result })
    },
)

export const refreshUrl = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user
    let videoId = req.params.videoId as string
    let result = await refreshSignedUrl(videoId, user.userId)
    res.status(200).json({ success: true, data: result })
})

export const search = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let q = req.query.q as string
    let user = (req as any).user
    let language = user?.language?.code || "en"
    let result = await searchVideos(language, q, req.query as Record<string, any>)
    res.status(200).json({ success: true, data: result })
})
