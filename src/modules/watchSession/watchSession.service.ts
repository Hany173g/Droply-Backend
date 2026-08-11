import WatchSession from "./watchSession.model.js"
import { generateToken } from "../../utils/generateRandomToken.js"
import mongoose from "mongoose"
import { ApiError } from "../../utils/ApiError.js"
import Video from "../videos/models/videos.model.js"
import type { IUserVideo } from "../videos/video.types.js"
import UserVideo from "../videos/models/userVideo.model.js"
import { ApiFeatures } from "../../utils/ApiFeatures.js"
export async function createWatchSession(data: {
    userVideoId: string
    userId?: string
    ip: string
    userAgent?: string
}) {
    let query: any = { userVideoId: data.userVideoId, expired: { $gt: new Date() } }
    if (data.userId) {
        query.userId = data.userId
    } else {
        query.ip = data.ip
        if (data.userAgent) query.userAgent = data.userAgent
    }

    let insert: any = {
        userVideoId: data.userVideoId,
        ip: data.ip,
        userAgent: data.userAgent,
        token: generateToken(),
        expired: new Date(Date.now() + 60 * 60 * 1000),
    }
    if (data.userId) insert.userId = data.userId

    let session = await WatchSession.findOneAndUpdate(
        query,
        { $setOnInsert: insert },
        { upsert: true, returnDocument: "after" },
    )
    return session
}

function checkHeartBeat(timeWatching: number, updatedAt: number) {
    let elapsedSeconds = (Date.now() - updatedAt) / 1000 + 10 // 10 seconds beacuse if request heartbeat delay
    if (timeWatching > elapsedSeconds) {
        throw ApiError.unprocessableEntity(
            "The heart beat is correct , stop cheating please or report if this problem",
        )
    }
}

export async function watchingTrack(
    token: string,
    timeWatching: number,
    userVideoId: string,
    ip: string,
) {
    const session = await mongoose.startSession()
    try {
        await session.startTransaction()
        let watchSession = await WatchSession.findOne({ token }).populate<{
            userVideoId: IUserVideo
        }>("userVideoId")
        if (!watchSession) {
            throw ApiError.notFound("Session not found")
        } else if (watchSession.expired < new Date()) {
            watchSession.expired = new Date(Date.now() + 60 * 1000) // To know how much people watching in same time
        }
        checkHeartBeat(timeWatching, watchSession.updatedAt.getTime())
        let totalWatching = watchSession.timeWatch + timeWatching
        let video = await Video.findById(watchSession.userVideoId.videoId)
        if (!video) throw ApiError.notFound("Video not found")
        watchSession.timeWatch = totalWatching
        if (totalWatching > video?.duration) {
            await watchSession.save({ session })
            await session.commitTransaction()
            return
        }
        let checkIp = await WatchSession.findOne({ ip, userVideoId, isView: true })
        if (totalWatching > video.duration / 4 && !checkIp) {
            await UserVideo.findOneAndUpdate(
                { _id: watchSession.userVideoId as unknown as mongoose.Types.ObjectId },
                {
                    $inc: {
                        views: 1,
                    },
                },
                {
                    session,
                },
            )
            watchSession.isView = true
        }
        await watchSession.save({ session })
        await session.commitTransaction()
    } catch (err) {
        await session.abortTransaction()
        throw err
    } finally {
        await session.endSession()
    }
}

export async function getVideosTrack(userVideosId: mongoose.Types.ObjectId[], userId: string) {
    let watchSessions = await WatchSession.find({
        userVideoId: { $in: userVideosId },
        userId,
    })
    return watchSessions
}

export async function getWatchHistory(
    userId: mongoose.Types.ObjectId,
    queryString?: Record<string, any>,
) {
    let baseQuery = WatchSession.find({ userId }).populate({
        path: "userVideoId",
        select: "title slug thumbnail type userId",
        populate: { path: "userId", select: "name username" },
    })
    let features = new ApiFeatures(baseQuery, queryString || {}).sort().pagination()
    let watchHistory = await features.query
    return watchHistory
}
