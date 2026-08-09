import mongoose from "mongoose"

const refreshTokenSchema = new mongoose.Schema(
    {
        token: { type: String, required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        userAgent: String,
        ipAddress: String,
        expiresAt: {
            type: Date,
            required: true,
        },
        isInvalid: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
)

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

let RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema)

export default RefreshToken
