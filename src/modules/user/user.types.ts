import type { HydratedDocument } from "mongoose"

export type userRoles = "user" | "admin"

export interface IUser {
    username: string
    name: string
    password: string
    role: string
    plan: string
    email: string
    status: string
    verificationExpiresAt: Date
    twoFactorAuthentication: boolean
    language: { code: string; name: string; nativeName: string }
    photo?: { url: string; publicId: string }
}

export type UserDocument = HydratedDocument<IUser>
