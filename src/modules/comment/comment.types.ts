import { Types } from "mongoose"

export interface IComment {
    user: Types.ObjectId;
    targetId: Types.ObjectId;
    targetType: string;
    content: string;
    action?: {
        isLike: boolean;
        type: "like" | "dislike";
    };
    createdAt: Date;
    updatedAt: Date;
}
