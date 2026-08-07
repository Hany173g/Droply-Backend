import { Types } from "mongoose"

export interface IWatchSession {
    userId: Types.ObjectId;
    userVideoId: Types.ObjectId;
    ip: string;
    userAgent?: string;
    timeWatch: number;
    token: string;
    expired: Date;
    createdAt: Date;
    updatedAt: Date;
    isView: boolean
}
