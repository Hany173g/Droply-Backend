import User from "../user/models/user.model.js"
import { auth } from "../../constants/auth.js"
import { ApiError } from "../../utils/ApiError.js"
import bcrypt from "bcrypt"
import VerifyToken from "./models/tokenVerify.js"
import { generateToken, generateCode } from "../../utils/generateRandomToken.js"
import sentEmail from "../../utils/sentEmail.js"
import fs, { access } from "fs"
import path from "path"
import { env } from "../../config/env.js"
import { fileURLToPath } from "url"
import type { IVerifyToken } from "./auth.types.js"
import { accessTokenConfig, refreshTokenConfig } from "../../config/jwt.js"
import jwt from "jsonwebtoken"
import type { ITokenPayload } from "./auth.types.js"
import RefreshToken from "./models/refreshToken.js"
import type { IUser } from "../user/user.types.js"
import { Types } from "mongoose"
import { createChannel } from "../channel/channel.service.js"
import { resolveLanguage } from "../../utils/resolveLanguage.js"

// Check if password contain password or symbol
export function checkPassword(password: string) {
    let includeNumber = /[0-9]/
    let includeSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/
    let checkHasNumber = includeNumber.test(password)
    let checkHasSymbol = includeSymbol.test(password)
    if (!checkHasNumber) {
        throw ApiError.unprocessableEntity("Password Must contain number")
    }
    if (!checkHasSymbol) {
        throw ApiError.unprocessableEntity("Password Must contain Symbol")
    }
}

export async function emailValidation(email: string) {
    let regaxEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z]+\.[a-zA-Z]+$/
    let isEmail = regaxEmail.test(email)
    if (!isEmail) {
        throw ApiError.unprocessableEntity("This not a email")
    }
    let regaxGmail = /^[a-zA-Z0-9._-]+@gmail\.com$/
    let isGmail = regaxGmail.test(email)
    if (!isGmail) {
        throw ApiError.unprocessableEntity("We only support gmail")
    }
    let checkEmail = await User.findOne({ email })
    if (checkEmail) {
        throw ApiError.conflict("Email already exists")
    }
}

async function hashPassword(password: string) {
    const hash = await bcrypt.hash(password, 10)
    if (!hash) throw ApiError.internal("Failed to hash password")
    return hash
}

// Generate Random Password From Name
export async function generateUsername(name: string, n: number = 0) {
    let username = name
    let user
    if (n == 0) {
        user = await User.findOne({ username })
    } else {
        username = name + Math.floor(Math.random() * n).toString()
        user = await User.findOne({ username })
    }
    if (user) {
        // Recursion
        return await generateUsername(name, n + 1)
    }
    return username
}

export async function checkUserByEmail(email: string, select: boolean = false) {
    let user
    if (select) {
        user = await User.findOne({ email }).select("+password")
    } else {
        user = await User.findOne({ email })
    }
    if (!user) {
        throw ApiError.notFound("User not found")
    }
    return user
}

// Read in loading file
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const verifyPath = path.join(__dirname, "../../templates/confirmAccount.html")
const htmlTemplate = fs.readFileSync(verifyPath, "utf8")

export async function Register(
    name: string,
    password: string,
    email: string,
    acceptLanguage?: string,
) {
    checkPassword(password)
    await emailValidation(email)
    let username = await generateUsername(name)
    password = await hashPassword(password)
    let language = resolveLanguage(acceptLanguage)
    let verificationExpiresAt = new Date(Date.now() + auth.token.expired * 60 * 1000)
    let user = await User.create({
        name,
        username,
        email,
        password,
        verificationExpiresAt,
        language,
    })
    if (!user) throw ApiError.internal("Failed to create user")
    let verifyToken = generateToken()
    let token = await VerifyToken.create({
        type: "confirm-account",
        userId: user._id,
        expiredAt: verificationExpiresAt,
        token: verifyToken,
    })
    if (!token) throw ApiError.internal("Failed to create verifyToken")
    // Replace placeholder in html template
    let html = htmlTemplate
        .replace("{{expiresIn}}", auth.token.expired.toString())
        .replace("{{confirmationLink}}", `${env.client.url}/verify-account/${verifyToken}`)

    await sentEmail(email, "Confirm Your Account", html)
}

export function checkExpiredToken(token: IVerifyToken | null) {
    let now = new Date()
    if (!token) {
        throw ApiError.notFound("Verification Token not found or expired")
    } else if (now > token.expiredAt) {
        throw new ApiError("Verification Token is expired", 410)
    }
    return token
}

export async function verifyAccount(verifyToken: string) {
    let checkToken = await VerifyToken.findOne({ type: "confirm-account", token: verifyToken })
    checkExpiredToken(checkToken)
    if (!checkToken) return
    let user = await User.findByIdAndUpdate(
        checkToken.userId,
        { $set: { status: "approved" } },
        { new: true },
    )
    if (!user) {
        throw ApiError.notFound("User not found or deleted")
    }
    let channel = await createChannel(user._id)
    if (!channel) {
        await User.findByIdAndDelete(user._id)
        throw ApiError.internal("Failed to verify account, please try again")
    }
    await VerifyToken.deleteOne({ _id: checkToken._id })
}

const forgetPath = path.join(__dirname, "../../templates/forgetPassword.html")
const forgetTemplate = fs.readFileSync(forgetPath, "utf8")

const loginPath = path.join(__dirname, "../../templates/newLogin.html")
const loginTemplate = fs.readFileSync(loginPath, "utf8")

const twoFactorPath = path.join(__dirname, "../../templates/twoFactor.html")
const twoFactorTemplate = fs.readFileSync(twoFactorPath, "utf8")

export async function forgetPassword(email: string) {
    let user = await checkUserByEmail(email)
    let verifyToken = generateToken()
    let verificationExpiresAt = new Date(Date.now() + auth.token.expired * 60 * 1000)
    await VerifyToken.deleteMany({ userId: user._id, type: "forget-password" })
    await VerifyToken.create({
        type: "forget-password",
        userId: user._id,
        expiredAt: verificationExpiresAt,
        token: verifyToken,
    })
    let html = forgetTemplate
        .replace("{{expiresIn}}", auth.token.expired.toString())
        .replace("{{resetLink}}", `${env.client.url}/forget-password/${verifyToken}`)
    await sentEmail(email, "Forget password email", html)
}

export async function verifyForgetPasswordToken(token: string) {
    let checkToken = await VerifyToken.findOne({ type: "forget-password", token })
    checkExpiredToken(checkToken)
    if (!checkToken) return // Skip typescript errors
    let verifyToken = generateToken()
    let verificationExpiresAt = new Date(Date.now() + auth.token.expired * 60 * 1000)
    let progressToken = await VerifyToken.create({
        type: "progress-forget-password",
        userId: checkToken.userId,
        expiredAt: verificationExpiresAt,
        token: verifyToken,
    })
    await VerifyToken.deleteOne({ _id: checkToken._id })
    return progressToken
}

export async function updatePassword(verifyToken: string, password: string) {
    let checkToken = await VerifyToken.findOne({
        type: "progress-forget-password",
        token: verifyToken,
    })
    checkExpiredToken(checkToken)
    if (!checkToken) return // Skip typescript errors
    password = await hashPassword(password)
    let user = await User.findOneAndUpdate({ _id: checkToken.userId }, { $set: { password } })
    await VerifyToken.deleteOne({ _id: checkToken._id })
}

export async function sendLoginAlert(
    name: string,
    email: string,
    device: string,
    location: string,
) {
    let now = new Date()
    let time = now.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
    let html = loginTemplate
        .replace("{{name}}", name)
        .replace("{{device}}", device)
        .replace("{{location}}", location)
        .replace("{{time}}", time)
    await sentEmail(email, "New sign-in to your Droply account", html)
}

// Generate JWT Refresh Token (long-lived - 1 Hour)
export function createAccessToken(payload: ITokenPayload) {
    return jwt.sign(payload, accessTokenConfig.secret, { expiresIn: accessTokenConfig.expiresIn })
}

// Generate JWT Refresh Token (long-lived - 7 days)
export function createRefreshToken(payload: ITokenPayload) {
    return jwt.sign(payload, refreshTokenConfig.secret, { expiresIn: refreshTokenConfig.expiresIn })
}

export async function sendTwoFactorAuthentication(user: { _id: Types.ObjectId; email: string }) {
    let token = generateCode()
    let verificationId = generateToken()
    let checkToken = await VerifyToken.findOne({ token })
    if (checkToken) {
        await sendTwoFactorAuthentication(user) // Recursion
    }
    // Delete old tokens
    await VerifyToken.deleteMany({
        userId: user._id,
        type: "two-factor-auth",
    })
    let verificationExpiresAt = new Date(Date.now() + auth.token.expired * 60 * 1000)
    let newVerifyToken = await VerifyToken.create({
        type: "two-factor-auth",
        userId: user._id,
        expiredAt: verificationExpiresAt,
        token,
        verificationId,
    })
    if (!newVerifyToken) throw ApiError.internal("Failed to create verify token, please try again")
    let html = twoFactorTemplate
        .replace("{{code}}", token)
        .replace("{{expiresIn}}", auth.token.expired.toString())
    await sentEmail(user.email, "Your Droply verification code", html)
    return verificationId
}

async function handleSuccessfulLogin(
    user: IUser & { _id: Types.ObjectId },
    ipAddress: string,
    userAgent: string,
) {
    let payload: ITokenPayload = {
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        username: user.username,
        email: user.email,
    }
    let accessToken = createAccessToken(payload)
    let refreshToken = createRefreshToken(payload)
    await RefreshToken.create({
        token: refreshToken,
        userId: user._id,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 day
        ipAddress,
        userAgent,
    })
    await sendLoginAlert(user.name, user.email, userAgent || "Unknown", ipAddress || "Unknown")
    return { accessToken, refreshToken }
}

function checkUserStatus(user: IUser) {
    if (user.status === "pending") {
        throw ApiError.unAuthorized("Please verify your account")
    }
}

export async function twoFactorAuthenticationFlow(
    token: string,
    verificationId: string,
    userAgent: string,
    ipAddress: string,
) {
    const checkToken = await VerifyToken.findOne({
        type: "two-factor-auth",
        verificationId,
    })

    if (!checkToken) {
        throw ApiError.notFound("Code not found")
    }

    if (new Date() > checkToken.expiredAt) {
        await checkToken.deleteOne()
        throw ApiError.unAuthorized("Code is expired, please login again")
    }

    if (checkToken.token !== token) {
        const updated = await VerifyToken.findOneAndUpdate(
            { _id: checkToken._id },
            { $inc: { attempts: 1 } },
            { new: true },
        )
        if (!updated) {
            throw ApiError.notFound("Code not found")
        }
        if (updated.attempts >= auth.token.attempts) {
            await updated.deleteOne()
            throw ApiError.forbidden("Too many failed attempts, please login again")
        }
        throw ApiError.unAuthorized("Code is invalid")
    }

    const user = await User.findById(checkToken.userId)

    if (!user) {
        throw ApiError.notFound("User not found or deleted")
    }
    checkUserStatus(user)
    await checkToken.deleteOne()

    const { accessToken, refreshToken } = await handleSuccessfulLogin(user, ipAddress, userAgent)

    return { accessToken, refreshToken }
}

export async function login(email: string, password: string, userAgent: string, ipAddress: string) {
    checkPassword(password)
    let user = await checkUserByEmail(email, true)
    checkUserStatus(user)
    let isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw ApiError.unAuthorized("Invalid password")
    }
    if (user.twoFactorAuthentication) {
        let verificationId = await sendTwoFactorAuthentication(user)
        let isTwoAuth = true
        return { isTwoAuth, verificationId }
    }
    const { accessToken, refreshToken } = await handleSuccessfulLogin(user, ipAddress, userAgent)
    return { accessToken, refreshToken }
}

export async function refresh(refreshToken: string) {
    try {
        if (!refreshToken) {
            throw ApiError.unprocessableEntity("RefreshToken not found")
        }
        const payload = jwt.verify(refreshToken, env.jwt.REFRESH_TOKEN_SECRET)
        let checkToken = await RefreshToken.findOne({ token: refreshToken })
        if (!checkToken) {
            throw ApiError.notFound("Token expired or delete")
        } else {
            if (checkToken.isInvalid) {
                throw ApiError.unAuthorized("Token is invalid please login")
            }
        }
        const { iat, exp, ...cleanPayload } = payload as any
        const accessToken = createAccessToken(cleanPayload as ITokenPayload)
        return accessToken
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw ApiError.unAuthorized("Token is expired")
        }
        if (err instanceof jwt.JsonWebTokenError) {
            throw ApiError.unAuthorized("Invalid token")
        }
        if (err instanceof ApiError) {
            throw err
        }
        throw ApiError.unAuthorized("Authentication failed")
    }
}
