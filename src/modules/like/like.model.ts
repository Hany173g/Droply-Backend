import mongoose, { Types } from "mongoose";
import type { ILike } from "./like.types.js";

const likeSchema = new mongoose.Schema({
    user: {
        type: Types.ObjectId,
        ref: "Users",
        required: true
    },
    targetId: {
        type: Types.ObjectId,
        required: true
    },
    targetType: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["like", "dislike"],
        default: "like"
    }
}, {
    timestamps: true
});

likeSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });

const Like = mongoose.model<ILike>("Like", likeSchema);
export default Like;
