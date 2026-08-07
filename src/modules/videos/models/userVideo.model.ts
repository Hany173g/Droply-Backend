import mongoose, { Types } from "mongoose";
import type { IUserVideo } from "../video.types.js";


const userVideoSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ["video", "reels"],
        default: "video"
    },
    status: {
        type: String,
        enum: ["public", "private"],
        default: "public"
    },
    views: {
        type: Number,
        default: 0
    },
    videoId: {
        type: Types.ObjectId,
        ref: "Video",

    },
    userId: {
        type: Types.ObjectId,
        ref: "Users",
        required: true
    },
    channelId: {
        type: Types.ObjectId,
        ref: "Channel"
    },
    upload:{
        type : String,
        default: "upload"
    },
    jobId: {
        type: String
    },
    comments: [{
        user: { type: Types.ObjectId, ref: "Users", required: true },
        content: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
    }],
    likesCount: {
        type: Number,
        default: 0
    },
    dislikesCount: {
        type: Number,
        default: 0
    },
    commentsCount: {
        type: Number,
        default: 0
    },
    language:{
        type: String,
        default : "en"
    },
    thumbnail:{
        url: String,
        publicId: String
    },
    timeWatch:{
        type: Number,
        default: 0
    },
    randomKey: {
        type: Number,
        default: Math.random
    }
}, {
    timestamps: true
});

userVideoSchema.index({ slug: 1, userId: 1 }, { unique: true });
userVideoSchema.index({ randomKey: 1 });
userVideoSchema.index({ views: -1 });
userVideoSchema.index({ createdAt: -1 });
userVideoSchema.index({ title: "text", description: "text" })
const UserVideo = mongoose.model<IUserVideo>("UserVideo", userVideoSchema);
export default UserVideo;
