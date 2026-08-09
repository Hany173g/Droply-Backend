import { Types } from "mongoose"

export interface ILike {
    user: Types.ObjectId
    targetId: Types.ObjectId
    targetType: string
    type: "like" | "dislike"
    createdAt: Date
    updatedAt: Date
}
