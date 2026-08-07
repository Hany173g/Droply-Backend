import UserVideo from "../videos/models/userVideo.model.js";
import User from "../user/models/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { mergeWatchTimeToVideo } from "../videos/video.service.js";
import { DEFAULT_LANGUAGE } from "../../constants/languages.js";

async function getRecommendedVideos(filters: Record<string, any>, limit: number, skip: number, type: "video" | "reels") {
    let half = Math.ceil(limit / 2);
    let randomValue = Math.random();
    let popular = await UserVideo.find({ ...filters, randomKey: { $gt: randomValue } })
        .sort({ views: -1 })
        .populate("userId", "name username photo")
        .populate("videoId", "duration")
        .skip(skip)
        .limit(half)
        .lean();

    let popularIds = popular.map(v => v._id);
    let recent = await UserVideo.find({ ...filters, _id: { $nin: popularIds } })
        .sort({ createdAt: -1 })
        .populate("userId", "name username photo")
        .populate("videoId", "duration")
        .skip(skip)
        .limit(half)
        .lean();

    let remaining = limit - (popular.length + recent.length);
    let result = [...popular, ...recent];

    if (remaining > 0) {
        let usedIds = [...popularIds, ...recent.map(v => v._id)];
        let random = await UserVideo.find({
            status: "public",
            type,
            _id: { $nin: usedIds },
            upload: "complete"
        })
            .populate("userId", "name username photo")
            .populate("videoId", "duration")
            .sort({ createdAt: -1 })
            .limit(remaining)
            .lean();
        result = [...result, ...random];
    }

    return result;
}

export async function getHomeFeed(page: number = 1, limit: number = 20, acceptLanguage?: string, userId?: string) {
    let skip = (page - 1) * limit;
    let language = DEFAULT_LANGUAGE.code;

    if (userId) {
        let user = await User.findById(userId).lean();
        if (user?.language?.code) language = user.language.code;
    } else if (acceptLanguage) {
        let parsed = acceptLanguage.split(",")[0]?.split(";")[0]?.split("-")[0]?.trim().toLowerCase();
        if (parsed) language = parsed;
    }

    let videos = await getRecommendedVideos({
        upload: "complete",
        status: "public",
        type: "video",
        language
    }, limit, skip, "video");

    if (userId) {
        videos = await mergeWatchTimeToVideo(videos, userId);
    }

    return videos;
}


export async function getShorts(page: number = 1, limit: number = 20, acceptLanguage?: string, userId?: string) {
    let skip = (page - 1) * limit;
    let language = DEFAULT_LANGUAGE.code;

    if (userId) {
        let user = await User.findById(userId).lean();
        if (user?.language?.code) language = user.language.code;
    } else if (acceptLanguage) {
        let parsed = acceptLanguage.split(",")[0]?.split(";")[0]?.split("-")[0]?.trim().toLowerCase();
        if (parsed) language = parsed;
    }

    let videos = await getRecommendedVideos({
        upload: "complete",
        status: "public",
        type: "reels",
        language
    }, limit, skip, "reels");

    if (userId) {
        videos = await mergeWatchTimeToVideo(videos, userId);
    }

    return videos;
}


