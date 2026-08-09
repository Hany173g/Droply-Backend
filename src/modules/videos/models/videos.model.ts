import mongoose, { Types } from "mongoose"
import type { IVideo } from "../video.types.js"

const videoSchema = new mongoose.Schema(
    {
        url: {
            type: {
                url: { type: String, required: true },
                publicId: { type: String, required: true },
            },
            select: false,
        },
        hash: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        reference_count: {
            type: Number,
            default: 1,
            select: false,
        },
        resolution: {
            width: { type: Number, required: true },
            height: { type: Number, required: true },
        },
        size_bytes: {
            type: Number,
            required: true,
        },
        userId: {
            type: Types.ObjectId,
            ref: "Users",
            required: true,
            select: false,
        },
    },
    {
        timestamps: true,
    },
)

const Video = mongoose.model<IVideo>("Video", videoSchema)
export default Video
