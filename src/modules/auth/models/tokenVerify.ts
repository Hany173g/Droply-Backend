import mongoose from "mongoose"
import {auth} from "../../../constants/auth.js"
import type {IVerifyToken} from "../auth.types.js"






const tokenSchema = new mongoose.Schema({
    token: {
        type:String,
        required:true
    },
    userId: {
        type : mongoose.Types.ObjectId,
        ref:"Users"
    },
    type : {
        type: String,
        enum: auth.token.type
    },
    expiredAt: {
        type : Date,
        required: true
    } ,
    attempts: {
        type: Number,
        default:0
    },
    verificationId: {
        type : String,
    }
}, {
    timestamps:true
})
tokenSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
const VerifyToken = mongoose.model<IVerifyToken>("TokensVerify",tokenSchema)

export default VerifyToken