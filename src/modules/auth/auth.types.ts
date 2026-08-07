import type {Types , HydratedDocument} from "mongoose"








export interface IVerifyToken {
    _id?: Types.ObjectId,
    type : string,
    userId : Types.ObjectId,
    token: string,
    expiredAt:Date,
    isInvalid: boolean
    verificationId: string
    attempts: number
}

export interface ITokenPayload {
    userId: string;
    role: string;
    name: string;
    email:string;
    username: string;
}
