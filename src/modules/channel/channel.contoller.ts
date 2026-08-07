import type { Request, Response, NextFunction } from "express";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { countries } from "../../constants/channel.js";
import {updateChannelInfo as updateChannelInfoService , getChannel as getChannelService , updateBannerOrPhotoChannel , handleSubscription as handleSubscriptionService, toggleNotification as toggleNotificationService }from "./channel.service.js"
export const getAllCountries = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const list = Object.entries(countries).map(([name, flag]) => ({ name, flag }));
  res.status(200).json({ success: true, data: list });
});



export const getChannel = asyncHandler(async (req : Request ,res : Response , next : NextFunction) => {
    let username = req.params.username as string
    let data = await getChannelService(username)
    res.status(200).json({success:true , channel: data.channel, name: data.name, username: data.username})
})

export const updateChannelInfo = asyncHandler(async (req : Request ,res : Response , next : NextFunction) => {
    let user = (req as any).user
    let {data} = req.body
    let channel = await  updateChannelInfoService(data , user.userId)
    res.status(200).json({success:true , message : "Channel is update",channel})
})

export const updateBannerPhoto = asyncHandler(async (req : Request ,res : Response , next : NextFunction) => {
    let user = (req as any).user
    let type = req.body.type as string
    let channel = await updateBannerOrPhotoChannel(req.file as Express.Multer.File, type, user.userId)
    res.status(200).json({success: true, channel})
})

export const handleSubscription = asyncHandler(async (req : Request ,res : Response , next : NextFunction) => {
    let user = (req as any).user
    let channelId = req.params.channelId as string
    let result = await handleSubscriptionService(user.userId, channelId)
    res.status(200).json({ success: true, action: result.action })
})

export const toggleNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let user = (req as any).user
    let channelId = req.params.channelId as string
    let result = await toggleNotificationService(user.userId, channelId)
    res.status(200).json({ success: true, isNotification: result.isNotification })
})