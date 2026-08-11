import Channel from "./models/channel.model.js"
import User from "../user/models/user.model.js"
import { Types } from "mongoose"
import { ApiError } from "../../utils/ApiError.js"
import type { IChannel, IChannelLink } from "./channel.types.js"
import { allowLinks, logoLinks, countries } from "../../constants/channel.js"
import type { HydratedDocument } from "mongoose"
import { uploadImageToCloudinary } from "../../config/uploadImageToCloudinary.js"
import Subscription from "./models/subscription.model.js"
import mongoose from "mongoose"
import { lightNotificationQueue } from "../notification/notification.queue.js"
export async function createChannel(userId: Types.ObjectId) {
    let newChannel = await Channel.create({ userId })
    return newChannel
}

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

async function handleLinks(
    links: IChannelLink[],
    channel: HydratedDocument<IChannel>,
): Promise<HydratedDocument<IChannel>> {
    let linksAndLogo = []
    if (links.length > 10) {
        throw ApiError.unprocessableEntity("The maximum number of links is 10")
    }
    for (const link of links) {
        if (!allowLinks.hasOwnProperty(link.nameLink)) {
            throw ApiError.unprocessableEntity("This site not support")
        }
        const escapedDomain = escapeRegExp(allowLinks[link.nameLink as keyof typeof allowLinks])
        const url = new RegExp(`^(https?://)?(www\\.)?${escapedDomain}/[a-zA-Z0-9~!@#$%^&*()_]+/?$`)
        const checkUrl = url.test(link.link)
        if (!checkUrl) {
            throw ApiError.unprocessableEntity(
                `This link is not match , example (${link.link}/User) `,
            )
        }
        link.logo = logoLinks[link.nameLink as keyof typeof logoLinks]
        linksAndLogo.push(link)
    }
    channel.links = linksAndLogo
    return channel
}

export async function updateChannelInfo(data: IChannel, userId: string): Promise<IChannel> {
    let channel = await Channel.findOne({ userId: userId })
    if (!channel) throw ApiError.notFound("Channel is delete")
    if (data.links && data.links.length > 0) {
        channel = await handleLinks(data.links, channel)
    }
    if (data.emailContact) {
        channel.emailContact = data.emailContact
    }
    if (data.description) {
        channel.description = data.description
    }
    if (data.isPublic !== undefined) {
        channel.isPublic = data.isPublic
    }
    if (data.location?.country) {
        const flagUrl = countries[data.location.country as keyof typeof countries]
        if (!flagUrl) {
            throw ApiError.unprocessableEntity(
                `Country "${data.location.country}" is not supported`,
            )
        }
        channel.location = {
            country: data.location.country,
            logoCountry: flagUrl,
        }
    }
    await channel.save()
    return channel
}

export async function getChannel(username: string) {
    let user = await User.findOne({ username })
    if (!user) throw ApiError.notFound("User not found")
    let channel = await Channel.findOne({ userId: user._id })
    if (!channel) throw ApiError.notFound("Channel not found")
    return { channel, name: user.name, username: user.username }
}

export async function updateBannerOrPhotoChannel(
    file: Express.Multer.File,
    type: string,
    userId: string,
) {
    let channel = await Channel.findOne({ userId: userId })
    if (!channel) throw ApiError.notFound("Channel is delete")
    if (type == "photo") {
        const result = await uploadImageToCloudinary(file.buffer, {
            folder: "channel-photos",
            width: 800,
            height: 800,
            crop: "thumb",
            gravity: "auto",
        })
        channel.photo = result
        await User.findByIdAndUpdate(userId, { photo: result })
    } else if (type == "banner") {
        const result = await uploadImageToCloudinary(file.buffer, {
            folder: "banners",
            width: 2048,
            height: 1152,
            crop: "fill",
            gravity: "auto",
        })
        channel.banner = result
    }
    await channel.save()
    return channel
}

async function checkChannel(channelId: string) {
    let channel = await Channel.findById(channelId)
    if (!channel) throw ApiError.notFound("Channel not found")
}

export async function handleSubscription(userId: string, channelId: string) {
    const session = await mongoose.startSession()
    try {
        await session.startTransaction()
        await checkChannel(channelId)
        let isSubscriber = await Subscription.findOne({
            subscriber: userId,
            channel: channelId,
        }).session(session)
        if (!isSubscriber) {
            const subscription = new Subscription({
                subscriber: userId,
                channel: channelId,
            })
            await subscription.save({ session })
        } else {
            await Subscription.deleteOne(
                {
                    subscriber: userId,
                    channel: channelId,
                },
                {
                    session,
                },
            )
        }
        let action = isSubscriber ? -1 : 1
        await Channel.updateOne(
            { _id: channelId },
            {
                $inc: {
                    subscribers: action,
                },
            },
            {
                session,
            },
        )
        await session.commitTransaction()
        if (action === 1) {
            lightNotificationQueue.add("notification", {
                userId: channelId,
                fromUserId: userId,
                type: "subscribe",
                targetId: channelId,
            })
        }
        return { action: action === 1 ? "subscribed" : "unsubscribed" }
    } catch (err) {
        await session.abortTransaction()
        throw err
    } finally {
        await session.endSession()
    }
}

export function getChannelSubscription(channelId: Types.ObjectId, isNotification: boolean) {
    return Subscription.find({
        channel: channelId,
        isNotification,
    })
        .lean()
        .cursor()
}

export async function toggleNotification(userId: string, channelId: string) {
    let subscription = await Subscription.findOne({ subscriber: userId, channel: channelId })
    if (!subscription) throw ApiError.notFound("Subscription not found")
    subscription.isNotification = !subscription.isNotification
    await subscription.save()
    return { isNotification: subscription.isNotification }
}
