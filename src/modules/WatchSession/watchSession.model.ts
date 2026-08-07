import mongoose from "mongoose"
import type { IWatchSession } from "./watchSession.types.js"

const watchSessionSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Types.ObjectId,
        ref:"Users"
    },
    userVideoId:{
        type: mongoose.Types.ObjectId,
        required:true ,
        ref: "UserVideo"
    },
    ip: {
        type : String,
        required:true
    },
    userAgent:{
        type:String
    },
    timeWatch:{
        type: Number ,
        default:0
    },
    token:{
        type : String,
        required:true
    },
    expired:{
        type:Date,
        required: true
    },
    isView: {
        type : Boolean,
        default: false
    }
}, {
    timestamps:true
})
watchSessionSchema.index({
    userId: 1,
    userVideoId: 1
})
watchSessionSchema.index({
    token: 1
}, {
    unique: true
})

const WatchSession = mongoose.model<IWatchSession>("WatchSession", watchSessionSchema)
export default WatchSession
