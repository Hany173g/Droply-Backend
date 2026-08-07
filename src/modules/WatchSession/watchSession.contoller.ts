import type { Request, Response, NextFunction } from "express";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { createWatchSession, watchingTrack, getWatchHistory } from "./watchSession.service.js";

export const createSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user;
    let { userVideoId } = req.body;
    const ip = req.ip ?? req.socket.remoteAddress ?? "";
    let userAgent = req.headers["user-agent"] || "";
    let session = await createWatchSession({
        userVideoId,
        userId: user?.userId,
        ip,
        userAgent,
    });
    res.status(201).json({ success: true, data: session });
});

export const trackSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let { token, timeWatching, userVideoId } = req.body;
    const ip = req.ip ?? req.socket.remoteAddress ?? "";
    await watchingTrack(token, timeWatching, userVideoId, ip);
    res.status(200).json({ success: true });
});

export const history = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user;
    let watchHistory = await getWatchHistory(user.userId, req.query);
    res.status(200).json({ success: true, data: watchHistory });
});
