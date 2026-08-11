import mongoose, { Types } from "mongoose"
import type { IChannel } from "../channel.types.js"

const channelSchema = new mongoose.Schema(
    {
        links: [
            {
                logo: {
                    type: String,
                    required: true,
                },
                link: {
                    type: String,
                    required: true,
                },
                nameLink: {
                    type: String,
                    required: true,
                },
            },
        ],
        emailContact: {
            type: String,
        },
        location: {
            country: String,
            logoCountry: String,
        },
        subscribers: {
            type: Number,
            default: 0,
        },
        videosCount: {
            type: Number,
            default: 0,
        },
        viewsCount: {
            type: Number,
            default: 0,
        },
        description: {
            type: String,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        userId: {
            type: Types.ObjectId,
            required: true,
            unique: true,
        },
        photo: {
            url: String,
            publicId: String,
        },
        banner: {
            url: String,
            publicId: String,
        },
    },
    {
        timestamps: true,
    },
)

const Channel = mongoose.model<IChannel>("Channel", channelSchema)
export default Channel
