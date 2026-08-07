import mongoose, { Types } from "mongoose";
import type { ISubscription } from "../channel.types.js";

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: Types.ObjectId,
        ref: "Users",
        required: true
    },
    channel: {
        type: Types.ObjectId,
        ref: "Users",
        required: true
    },
    isNotification: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true
});

subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema);
export default Subscription;
