import { jest, describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals"
import request from "supertest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import User from "../../src/modules/user/models/user.model"
import VerifyToken from "../../src/modules/auth/models/tokenVerify"

jest.unstable_mockModule("../../src/utils/sentEmail", () => ({
    default: jest.fn()
}))

jest.unstable_mockModule("../../src/constants/rateLimter", () => ({
    rateLimterGlobal: { window: 60 * 60 * 1000, max: 1000 },
    rateLimterAuth: { window: 60 * 60 * 1000, max: 1000 },
    upload: { window: 60 * 60 * 1000, max: 1000 },
    subscriptionLimiterConfig: { window: 60 * 60 * 1000, max: 1000 },
    refreshLimiterConfig: { window: 60 * 60 * 1000, max: 1000 },
    watchSessionLimiterConfig: { window: 60 * 60 * 1000, max: 1000 },
    notificationToggleLimiterConfig: { window: 60 * 60 * 1000, max: 1000 },
}))

const { default: app } = await import("../../src/app")
const sentEmail = (await import("../../src/utils/sentEmail")).default as jest.Mock

const validUser = {
    name: "Ahmed Ali",
    password: "Test1234!@",
    email: "ahmedali@gmail.com"
}

let mongoServer: MongoMemoryServer

const LONG_TIMEOUT = 300000

jest.setTimeout(LONG_TIMEOUT)

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
}, LONG_TIMEOUT)

afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})

beforeEach(async () => {
    jest.clearAllMocks()
    await mongoose.connection.dropDatabase()
})

describe("POST /api/auth/register", () => {
    it("should register user and return 201", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send(validUser)

        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.message).toContain("Account created successfully")

        const user = await User.findOne({ email: validUser.email })
        expect(user).not.toBeNull()
        expect(user!.name).toBe(validUser.name)
        expect(user!.status).toBe("pending")

        const token = await VerifyToken.findOne({ type: "confirm-account", userId: user!._id })
        expect(token).not.toBeNull()

        expect(sentEmail).toHaveBeenCalledWith(validUser.email, "Confirm Your Account", expect.any(String))
    })

    it("should return 400 if name is missing", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({ ...validUser, name: "" })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
    })

    it("should return 400 if password is too short", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({ ...validUser, password: "Test1@" })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
    })

    it("should return 409 if email already exists", async () => {
        await request(app)
            .post("/api/v1/auth/register")
            .send(validUser)

        const res = await request(app)
            .post("/api/v1/auth/register")
            .send(validUser)

        expect(res.status).toBe(409)
        expect(res.body.message).toBe("Email already exists")
        expect(await User.countDocuments({ email: validUser.email })).toBe(1)
    })

    it("should return 422 if email is not gmail", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({ ...validUser, email: "ahmedali@yahoo.com" })

        expect(res.status).toBe(422)
        expect(res.body.message).toBe("We only support gmail")
    })

    it("should return 422 if password has no symbol", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({ ...validUser, password: "Test123456" })

        expect(res.status).toBe(422)
        expect(res.body.message).toBe("Password Must contain Symbol")
    })

 
})



describe("Post /api/auth/verify-account/:verifyToken" , () => {
   it("should return 410 expired token", async () => {
        await request(app)
            .post("/api/v1/auth/register")
            .send(validUser)
        const tokenDoc = await VerifyToken.findOne({ type: "confirm-account"})  
        tokenDoc!.expiredAt = new Date(Date.now() - 60000)
        await tokenDoc!.save()
        const res = await request(app)
            .post(`/api/v1/auth/verify-account/${tokenDoc!.token}`)
        expect(res.status).toBe(410)
        expect(res.body.message).toBe("Verification Token is expired") 
    })
    it("should return 200 verify account", async () => {
        await request(app)
            .post("/api/v1/auth/register")
            .send(validUser)
        let tokenDoc = await VerifyToken.findOne({ type: "confirm-account" })
        const res = await request(app)
            .post(`/api/v1/auth/verify-account/${tokenDoc!.token}`)
        let user = await User.findById(tokenDoc!.userId)
        tokenDoc = await VerifyToken.findOne({ type: "confirm-account" })
        expect(tokenDoc).toBe(null)
        expect(res.status).toBe(200)
        expect(user!.status).toBe("approved")
        expect(res.body.success).toBe(true)
    })
    it("should return 404 if not found token" , async() => {
        await request(app)
            .post("/api/v1/auth/register")
            .send(validUser)
        const res = await request(app)
            .post(`/api/v1/auth/verify-account/randomToken`)
        expect(res.status).toBe(404)
        expect(res.body.message).toBe("Verification Token not found or expired")
    })
})


describe("Post /api/auth/forget-password" , () => {
    it("should return 400 if email not found" , async () => {
        let res = await request(app)
        .post("/api/v1/auth/forget-password")
        .send({})
        expect(res.status).toBe(400)
        expect(res.body.message).toBe("\"email\" is required")
    })
    it("should return 400 if email is not a valid email" , async () => {
        let res = await request(app)
        .post("/api/v1/auth/forget-password")
        .send({ email: "notanemail" })
        expect(res.status).toBe(400)
        expect(res.body.message).toBe("This is not a valid email")
    })
    it("should return 200 and create forget password token" , async () => {
        await request(app)
            .post("/api/v1/auth/register")
            .send(validUser)
        const res = await request(app)
            .post("/api/v1/auth/forget-password")
            .send({ email: validUser.email })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)

        const user = await User.findOne({ email: validUser.email })
        const token = await VerifyToken.findOne({ type: "forget-password", userId: user!._id })
        expect(token).not.toBeNull()
    })
})

describe("Post /api/auth/verifyForgetPasswordToken/:verifyToken" , () => {
    it("should return 410 expired token", async () => {
        await request(app)
            .post("/api/v1/auth/register")
            .send(validUser)
        await request(app)
            .post("/api/v1/auth/forget-password")
            .send({ email: validUser.email })
        const tokenDoc = await VerifyToken.findOne({ type: "forget-password" })
        tokenDoc!.expiredAt = new Date(Date.now() - 60000)
        await tokenDoc!.save()
        const res = await request(app)
            .post(`/api/v1/auth/verifyForgetPasswordToken/${tokenDoc!.token}`)
        expect(res.status).toBe(410)
        expect(res.body.message).toBe("Verification Token is expired")
    })
    it("should return 404 if not found token", async () => {
        const res = await request(app)
            .post("/api/v1/auth/verifyForgetPasswordToken/randomToken")
        expect(res.status).toBe(404)
        expect(res.body.message).toBe("Verification Token not found or expired")
    })
})