import mongoose, { Types } from "mongoose"

export interface IComment {
    user: Types.ObjectId
    content: string
    createdAt: Date
}

export interface IVideo {
    url: {
        url: string
        publicId: string
    }
    hash: string
    duration: number
    reference_count: number
    resolution: {
        width: number
        height: number
    }
    size_bytes: number
    userId: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

export interface IUserVideo {
    _id: mongoose.Types.ObjectId
    slug: string
    title: string
    thumbnail?: { url: string; publicId: string }
    description: string
    type: "video" | "reels"
    status: "public" | "private"
    views: number
    videoId: Types.ObjectId | null
    userId: Types.ObjectId
    channelId?: Types.ObjectId
    createdAt: Date
    updatedAt: Date
    upload: "upload" | "complete" | "faild"
    jobId: string
    comments: IComment[]
    likesCount: number
    dislikesCount: number
    commentsCount: number
    timeWatch?: number
    language: string
    randomKey: number
}
