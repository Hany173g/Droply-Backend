import { jest, describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals"
import request from "supertest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import User from "../../src/modules/user/models/user.model"
import VerifyToken from "../../src/modules/auth/models/tokenVerify"

jest.unstable_mockModule("../../src/utils/sentEmail", () => ({
    default: jest.fn()
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
            .post("/api/auth/register")
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
            .post("/api/auth/register")
            .send({ ...validUser, name: "" })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
    })

    it("should return 400 if password is too short", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ ...validUser, password: "Test1@" })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
    })

    it("should return 409 if email already exists", async () => {
        await request(app)
            .post("/api/auth/register")
            .send(validUser)

        const res = await request(app)
            .post("/api/auth/register")
            .send(validUser)

        expect(res.status).toBe(409)
        expect(res.body.message).toBe("Email already exists")
        expect(await User.countDocuments({ email: validUser.email })).toBe(1)
    })

    it("should return 422 if email is not gmail", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ ...validUser, email: "ahmedali@yahoo.com" })

        expect(res.status).toBe(422)
        expect(res.body.message).toBe("We only support gmail")
    })

    it("should return 422 if password has no symbol", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ ...validUser, password: "Test123456" })

        expect(res.status).toBe(422)
        expect(res.body.message).toBe("Password Must contain Symbol")
    })

    it("should not create user in db when email is not gmail", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({ ...validUser, email: "ahmedali@yahoo.com" })

        expect(await User.countDocuments({ email: "ahmedali@yahoo.com" })).toBe(0)
        expect(sentEmail).not.toHaveBeenCalled()
    })
})
