import UserVideo from "./models/userVideo.model.js"
import Video from "./models/videos.model.js"
import type {IUserVideo, IVideo} from "./video.types.js"
import User from "../user/models/user.model.js"
import Channel from "../channel/models/channel.model.js"
import {uploadReelToCloudinary,uploadVideoToCloudinary, type VideoUploadResult} from "../../config/uploadVideoToCloudinary.js"
import {uploadImageToCloudinary} from "../../config/uploadImageToCloudinary.js"
import { mediaInfoFactory } from 'mediainfo.js';
import fsPromises  from 'fs/promises';
import { ApiError } from "../../utils/ApiError.js"
import mongoose from "mongoose"
import crypto from 'crypto';
import { Job } from "bullmq"
import fs from 'fs';
import { generateToken } from "../../utils/generateRandomToken.js"
import {Types } from "mongoose"
import cloudinary from "../../config/cloudinary.js"
import {videoQueue , streamingQueue} from "./video.queue.js"
import { broadcastNotificationQueue } from "../notification/notification.queue.js"
import { ApiFeatures } from "../../utils/ApiFeatures.js"
import { franc } from "franc";
import { findLanguageByISO639_3, DEFAULT_LANGUAGE } from "../../constants/languages.js";
import {getVideosTrack} from "../WatchSession/watchSession.service.js"
async function getVideoDuration(filePath: string): Promise<number> {
  const mediainfo = await mediaInfoFactory({ format: 'JSON' });
  const buffer = await fsPromises.readFile(filePath);
  
  const result = await mediainfo.analyzeData(
    () => buffer.length,
    (size: any, offset: number | undefined) => buffer.subarray(offset, offset + size)
  );
  
  const data = JSON.parse(result);
  const generalTrack = data.media?.track?.find((t: any) => t['@type'] === 'General');
  
  if (!generalTrack || !generalTrack.Duration) {
    throw ApiError.badRequest("Invalid or corrupted video file")
  }
  
  return parseFloat(generalTrack.Duration);
}

function getFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk: Buffer) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function valadtionVideo(filePath: string): Promise<"video" | "reels"> {
    let duration = await getVideoDuration(filePath)
    if (duration < 3) {
        throw ApiError.badRequest("Video time must be bigger than 3 second")
    }
    let type: "video" | "reels" = duration > 90 ? "video" : "reels"
    return type
}


function getLanguageFromText(text: string): string {
    const code3 = franc(text);
    const lang = findLanguageByISO639_3(code3);
    return lang ? lang.code : DEFAULT_LANGUAGE.code;
}


async function createUserVideo(data : IUserVideo ,type : "video" | "reels",userId : string,upload : "upload" | "complete" | "faild", videoId : Types.ObjectId, thumbnail?: { url: string; publicId: string } | null  ) {
    let slug = generateToken()
    const language = getLanguageFromText(data.title)
    let channel = await Channel.findOne({ userId }).select("_id").lean();
    let doc: any = {
            slug,
            title:data.title,
            description: data.description,
            type,
            status:data.status,
            userId,
            channelId: channel?._id,
            upload,
            videoId,
            language
        }
        if (thumbnail) doc.thumbnail = thumbnail;
        await UserVideo.create(doc)
}


export async function waitForEagerCompletion(publicId: string,videoId : string,backOffDelay : number,job : Job): Promise<string | null> {
    console.log("iam work")
    const resource = await cloudinary.api.resource(publicId, { resource_type: 'video' });
    const eagerResult = resource.eager?.[0];
    if (eagerResult?.status === 'complete') {
      await Video.updateOne({_id:videoId} , {$set:{"url.url":eagerResult.secure_url}})  
      return eagerResult.secure_url; 
    }
    if (job.opts.attempts == job.attemptsMade) {
         await streamingQueue.add("streamingQueue", {
            publicId,
            videoId,
            backOffDelay
        }, {
            attempts:20,
            removeOnComplete:true,
            removeOnFail:{count:100},
            backoff: {type:"fixed",delay:backOffDelay},
            delay: 5 * 60 * 1000
        })
        return null
    }
 throw new Error("Streaming full hd not ready")
}


async function checkDuplicateVideo(
    filePath : string,
    userId : string , 
    data : IUserVideo, 
    type : "video" | "reels",
    thumbnailPath?: string | null) {
    let videoHash = await getFileHash(filePath)
    let duplicateCheck  = {success : false , hash: videoHash}
    let checkVideo = await Video.findOne({hash:videoHash}).select("+url")
    if (checkVideo) {
        let thumbnailData = null;
        if (thumbnailPath) {
            try {
                const thumbBuffer = await fsPromises.readFile(thumbnailPath);
                thumbnailData = await uploadImageToCloudinary(thumbBuffer, {
                    folder: 'thumbnails',
                    width: 1280,
                    height: 720,
                    crop: 'fill',
                });
            } catch {}
            await fsPromises.unlink(thumbnailPath).catch(() => {});
        }
        await Video.updateOne({ _id: checkVideo._id }, { $inc: { reference_count: 1 } })
        await createUserVideo(data , type , userId , "complete", checkVideo._id, thumbnailData)
        duplicateCheck .success = true
    }
    return duplicateCheck 

}

function getBackoffDelay(duration: number): number {
    if (duration < 120) return 5_000
    if (duration < 60 * 15) return 15_000
    if (duration < 60 * 60) return 30_000
    return 60_000
}

async function createVideo(userId:string,hash : string , result : VideoUploadResult )  {
    let url =  {
        url: result.originalUrl,
        publicId: result.publicId
    }
    let resolution = {
        width:result.width,
        height: result.height
    }
    let video = await Video.create({
         userId,
         url ,
         duration : result.duration,
         size_bytes:result.bytes ,
         resolution,
         hash
    })
    return video
}


export async function uploadVideoAndTumbail(userId : string,filePath : string , hashVideo : string ,userVideoId : string , tumbnailPath : string , job : Job) {
    let result: VideoUploadResult | null = null
    let userVideo: any = null
    if (!job.id) throw new Error("Job id is missing")
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1) - 1
    if (job.attemptsMade === 0) {
        userVideo = await UserVideo.findOneAndUpdate(
            {_id:userVideoId},
            {jobId:job.id},
            {returnDocument:'after'}
        )
    } else {
        userVideo = await UserVideo.findOne({userId,jobId:job.id})
        if (!userVideo) throw new Error("User video not found")
        if (userVideo.upload === "complete") return
    }
    if (!userVideo) throw new Error("User video not found")
    try {
        if (userVideo.type == "video") {
            result = await uploadVideoToCloudinary(filePath, {folder: "videos"})
        } else {
            result = await uploadReelToCloudinary(filePath, "reels")
        }
    } catch (err) {
        if (isLastAttempt) {
            await fsPromises.unlink(filePath).catch(() => {})
            userVideo.upload = "faild"
            await userVideo.save()
        }
        throw err
    }
    console.log("before created")
    let video
    try {
        video = await createVideo(userId, hashVideo, result)
    } catch (err) {
        console.error("createVideo error:", err)
        if (isLastAttempt) {
            await fsPromises.unlink(filePath).catch(() => {})
            userVideo.upload = "faild"
            await userVideo.save()
        }
        throw err
    }
    let backOffDelay = getBackoffDelay(video.duration)
    console.log("after created", video)

    let thumbnailData = null;
    if (tumbnailPath) {
        try {
            const thumbBuffer = await fsPromises.readFile(tumbnailPath);
            thumbnailData = await uploadImageToCloudinary(thumbBuffer, {
                folder: 'thumbnails',
                width: 1280,
                height: 720,
                crop: 'fill',
            });
        } catch (err) {
            console.error("Thumbnail upload failed:", err);
        }
        await fsPromises.unlink(tumbnailPath).catch(() => {});
    }

    await UserVideo.findByIdAndUpdate(userVideo._id, {$set:{videoId:video._id, upload:"complete", thumbnail: thumbnailData}})
    await fsPromises.unlink(filePath).catch(() => {})

    broadcastNotificationQueue.add("broadcast", {
        userId: userId,
        fromUserId: userId,
        type: "newVideo",
        targetId: userVideo._id.toString()
    });

    if (video.duration > 90 ) {
        await streamingQueue.add("streamingQueue", {
            publicId:video.url.publicId,
            videoId:video._id,
            backOffDelay
        }, {
            attempts:20,
            removeOnComplete:true,
            removeOnFail:{count:100},
            backoff: {type:"fixed",delay:backOffDelay
            },
        })
    }
}

export async function mergeWatchTimeToVideo<T extends IUserVideo>(videos : T[] , userId : string)  : Promise<T[]>{
    let videosId = videos.map(v => v._id)
    let watchSessions = await getVideosTrack(videosId , userId)
    const watchSessionsMap = new Map<mongoose.Types.ObjectId, number>(
        watchSessions.map((w): [mongoose.Types.ObjectId, number] => [w.userVideoId, w.timeWatch])
    );
    videos.forEach(v => {
        v.timeWatch = watchSessionsMap.get(v._id) ?? 0
    })
    return videos
} 



export async function getUserVideos(userId: string) {
    let videos  = await UserVideo.find({ userId }).sort({ createdAt: -1 }).populate("videoId").lean()
    let failedIds = videos.filter(v => v.upload === "faild").map(v => v._id)
    if (failedIds.length > 0) {
        await UserVideo.deleteMany({ _id: { $in: failedIds } })
    }
    videos = await mergeWatchTimeToVideo(videos , userId)
    return videos
}

export async function getPublicUserVideos(username: string , userId ? : string) {
    let user = await User.findOne({ username })
    if (!user) throw ApiError.notFound("User not found")
    let channel = await Channel.findOne({ userId: user._id })
    if (!channel || !channel.isPublic) throw ApiError.forbidden("This channel is private")
    let videos = await UserVideo.find({
     userId: user._id,
     upload: "complete",
     status: "public"
     }).sort({ createdAt: -1 }).populate("userId").populate("videoId").lean()
    if (userId) {
         videos = await mergeWatchTimeToVideo(videos, userId)
    } 
    return videos
}

export async function createVideoFlow(data : IUserVideo , userId : string, file: Express.Multer.File, thumbnail: Express.Multer.File) {
    let type = await valadtionVideo(file.path)
    let duplicateCheck  = await checkDuplicateVideo(file.path , userId , data , type, thumbnail?.path)
    if (duplicateCheck.success) {
        await fsPromises.unlink(file.path)
        return;
    }   
    const language = getLanguageFromText(data.title)
    let slug = generateToken()
    let channel = await Channel.findOne({ userId }).select("_id").lean();
    let doc: any = {
            slug,
            title:data.title,
            description: data.description,
            type,
            status:data.status,
            userId,
            upload:"upload",
            language
        }
    if (channel?._id) doc.channelId = channel._id;
    let userVideo = await UserVideo.create(doc)
    // Add upload video to queue
    await videoQueue.add('uploadVideo', {
        userId,
        filePath:file.path,
        hashVideo : duplicateCheck.hash,
        userVideoId: userVideo._id,
        thumbnailPath: thumbnail?.path || null
    }, {
        attempts:2,
        removeOnComplete:true,
        backoff: { type: 'fixed', delay: 3000 },
        priority: 1 ,
        removeOnFail: { count: 100 },
        jobId: generateToken(), 
    })
}



export async function updateVideoStatus(videoId: string, userId: string, status: "public" | "private") {
    let video = await UserVideo.findOne({ _id: videoId, userId })
    if (!video) throw ApiError.notFound("Video not found")
    video.status = status
    await video.save()
    return video
}


export function generateSignedVideoUrl(
  publicId: string,
  streamingProfile: string, 
  expiresInSeconds: number = 3600
): { url: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const url = cloudinary.url(publicId, {
    resource_type: 'video',
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
    format: 'm3u8',
    streaming_profile: streamingProfile,
  });

  return { url, expiresAt };
}


export async function getUserVideo(videoId : string , userId : string) {
   let userVideo = await UserVideo.findOne({
        _id: videoId,
        $or: [
            { status: "public" },
            { userId }
        ]
    }).populate({
        path:"videoId",
        select:"+url"
    }).populate({
        path:"userId",
        select:"name username photo"
    });
    if (!userVideo) {
        throw ApiError.notFound("Video not found");
    }
    let streamingProfile = userVideo.type == "reels"  ? "hd" : "full_hd"
    let signUrl = generateSignedVideoUrl(
        (userVideo.videoId as any)?.url?.publicId,
        streamingProfile,
        20 * 60
    )
    delete (userVideo.videoId as any)?.url
    return {userVideo, signUrl: signUrl.url};
}

export async function refreshSignedUrl(videoId: string, userId: string) {
    let userVideo = await UserVideo.findOne({ _id: videoId }).populate({ path: "videoId", select: "+url" });
    if (!userVideo) throw ApiError.notFound("Video not found");

    let video = userVideo.videoId as any;
    if (!video?.url?.publicId) throw ApiError.notFound("Video not found");

    let streamingProfile = userVideo.type === "reels" ? "hd" : "full_hd";
    let signUrl = generateSignedVideoUrl(video.url.publicId, streamingProfile, 20 * 60);

    return { signUrl: signUrl.url };
}


export async function checkUserVideoFound(videoId : string) {
    let video = await  UserVideo.findById(videoId)
    if (!video) {
        throw ApiError.notFound("Video not found")
    }
    return video
}





export async function searchVideos(language: string, text: string, queryString: Record<string, any>) {
    let baseQuery = UserVideo.find({
        language,
        $text: { $search: text }
    }).populate("videoId").populate("userId", "name username photo");
    let features = new ApiFeatures(baseQuery, queryString)
        .sort()
        .pagination();

    let result = await features.query;
    let limit = Number(queryString.limit) || 20;
    let remaining = limit - result.length
    let resultIds = result.map(v => v._id)
    if (remaining > 0) {
        let fallbackVideos = await UserVideo.find({
        language,
        _id:{$nin:resultIds}
        }).populate("videoId").populate("userId", "name username photo").limit(remaining)
        result = [...result , ...fallbackVideos]
    }
    return result
}