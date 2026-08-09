import { Types } from "mongoose"

export interface ISubscription {
    subscriber: Types.ObjectId
    channel: Types.ObjectId
    isNotification: boolean
    createdAt: Date
    updatedAt: Date
}

export interface IChannelLink {
    logo: string
    link: string
    nameLink: string
}

export interface IChannel {
    links: IChannelLink[]

    emailContant?: string

    location?: {
        country: String
        logoCountry: String
    }

    subscribers: number

    videosCount: number

    viewsCount: number

    description?: string
    isPublic: boolean
    userId: Types.ObjectId
    createdAt: Date
    updatedAt: Date
    photo: {
        url: string
        publicId: string
    }
    banner: {
        url: string
        publicId: string
    }
}
