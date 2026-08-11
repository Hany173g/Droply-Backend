import type { Request, Response, NextFunction } from "express"
import asyncHandler from "../../middlewares/asyncHandler.js"
import {
    getNotificationsByUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
} from "./notification.service.js"

export const getNotifications = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        let user = (req as any).user
        let result = await getNotificationsByUser(user.userId, req.query)
        res.status(200).json({ success: true, ...result })
    },
)

export const markAsRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user
    let notificationId = req.params.notificationId as string
    await markNotificationAsRead(notificationId, user.userId)
    res.status(200).json({ success: true, message: "Notification marked as read" })
})

export const markAllAsRead = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        let user = (req as any).user
        await markAllNotificationsAsRead(user.userId)
        res.status(200).json({ success: true, message: "All notifications marked as read" })
    },
)

export const deleteNotification = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        let user = (req as any).user
        let notificationId = req.params.notificationId as string
        await deleteNotificationById(notificationId, user.userId)
        res.status(200).json({ success: true, message: "Notification deleted" })
    },
)
