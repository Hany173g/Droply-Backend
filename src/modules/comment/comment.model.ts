import mongoose, { Types } from "mongoose";
import type { IComment } from "./comment.types.js";

const commentSchema = new mongoose.Schema({
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
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    }
}, {
    timestamps: true
});

commentSchema.index({ targetId: 1, targetType: 1, createdAt: -1 });

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;
