import mongoose, { trusted } from "mongoose"
import { userValadtion, user } from "../../../constants/user.js"
import type { IUser } from "../user.types.js"

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            minlength: userValadtion.username.min,
            maxlength: userValadtion.username.max,
            unique: true,
            required: true,
        },
        name: {
            type: String,
            minlength: userValadtion.name.min,
            maxlength: userValadtion.name.max,
            required: true,
        },
        password: {
            type: String,
            select: false,
        },
        role: {
            type: String,
            enum: user.role,
            default: "user",
        },
        plan: {
            type: String,
            enum: user.plan,
            default: "free",
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            default: "pending",
        },
        twoFactorAuthentication: {
            type: Boolean,
            default: false,
        },
        language: {
            code: { type: String, required: true, default: "en" },
            name: { type: String, required: true, default: "English" },
            nativeName: { type: String, required: true, default: "English" },
        },
        photo: {
            url: String,
            publicId: String,
        },
        verificationExpiresAt: Date,
    },
    {
        timestamps: true,
    },
)

userSchema.index(
    { verificationExpiresAt: 1 },
    {
        expireAfterSeconds: 0,
        partialFilterExpression: {
            status: "pending",
        },
    },
)
const User = mongoose.model<IUser>("Users", userSchema)

export default User
