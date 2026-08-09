import { describe, expect, it, jest, afterEach, beforeEach } from "@jest/globals"
import type { UserDocument } from "../../src/modules/user/user.types"
import type { IVerifyToken } from "../../src/modules/auth/auth.types"
import bcrypt from "bcrypt"
import User from "../../src/modules/user/models/user.model"
import VerifyToken from "../../src/modules/auth/models/tokenVerify"
import {
    mockVerifyTokenExpired,
    mockFindVerifyToken,
    mockFindUser,
    mockVerifiedUser,
} from "../helpers/user.service.helper"
import Channel from "../../src/modules/channel/models/channel.model"
jest.unstable_mockModule("../../src/utils/sentEmail", () => ({
    default: jest.fn(),
}))

let authService: typeof import("../../src/modules/auth/auth.service")

describe("Auth Service", () => {
    let validToken: {
        _id: string
        userId: string
        expiredAt: Date
    }
    beforeEach(async () => {
        ;((authService = await import("../../src/modules/auth/auth.service")),
            (validToken = {
                _id: "token123",
                userId: "user123",
                expiredAt: new Date(Date.now() + 60000),
            }))
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe("Check Password", () => {
        it("should throw if password has no number", () => {
            expect(() => authService.checkPassword("thisisadroplypassword")).toThrow()
        })
        it("should throw if password has no symbol", () => {
            expect(() => authService.checkPassword("droplyiscreatedin2026")).toThrow()
        })
        it("should pass if password has number and symbol", () => {
            expect(() => authService.checkPassword("droply1sabeststreamingvideo^_!")).not.toThrow()
        })
    })

    describe("Email Valadtion", () => {
        it("should throw if input not email", async () => {
            await expect(authService.emailValadtion("droply")).rejects.toThrow()
        })
        it("should throw if email not gmail", async () => {
            await expect(authService.emailValadtion("droply@yahoo.com")).rejects.toThrow()
        })
        it("should throw if email is duplicate", async () => {
            jest.spyOn(User, "findOne").mockResolvedValue({
                id: 1,
                user: "Droply",
            } as unknown as UserDocument)
            await expect(authService.emailValadtion("droply@gmail.com")).rejects.toThrow()
        })
    })

    describe("Check User By Email", () => {
        it("should throw error if user not found", async () => {
            jest.spyOn(User, "findOne").mockResolvedValue(null as never)
            await expect(authService.checkUserByEmail("droply@gmail.com")).rejects.toThrow()
        })
    })

    describe("Register", () => {
        beforeEach(() => {
            jest.spyOn(User, "findOne").mockResolvedValue(null)
        })
        it("should hash throw error if is faild", async () => {
            jest.spyOn(bcrypt, "hash").mockResolvedValue(null as never)
            await expect(
                authService.Register("Droply", "droplypassword5!", "droply@gmail.com"),
            ).rejects.toThrow()
        })
        it("should throw if create user faild", async () => {
            jest.spyOn(User, "create").mockResolvedValue(null as never)
            await expect(
                authService.Register("Droply", "droplypassword5!", "droply@gmail.com"),
            ).rejects.toThrow()
        })
        it("should throw if create verify token faild", async () => {
            jest.spyOn(User, "create").mockResolvedValue({ _id: "123" } as never)
            jest.spyOn(VerifyToken, "create").mockResolvedValue(null as never)
            await expect(
                authService.Register("Droply", "droplypassword5!", "droply@gmail.com"),
            ).rejects.toThrow()
        })
        it("should call sentEmail", async () => {
            const sentEmail = (await import("../../src/utils/sentEmail")).default as jest.Mock
            sentEmail.mockClear()
            jest.spyOn(User, "create").mockResolvedValue({ _id: "123" } as never)
            jest.spyOn(VerifyToken, "create").mockResolvedValue({ _id: "456" } as never)
            await authService.Register("Droply", "droplypassword5!", "droply@gmail.com")
            expect(sentEmail).toHaveBeenCalledWith(
                "droply@gmail.com",
                "Confirm Your Account",
                expect.any(String),
            )
        })
    })

    describe("checkExpiredToken", () => {
        it("should throw if token not found", () => {
            expect(() => authService.checkExpiredToken(null)).toThrow()
        })
        it("should throw if token is expired", () => {
            const now = new Date()
            let token = { expiredAt: new Date(now.getTime() - 10000) }
            expect(() => authService.checkExpiredToken(token as unknown as IVerifyToken)).toThrow()
        })
    })

    describe("verifyAccount", () => {
        it("should throw if verify token not found", async () => {
            mockFindVerifyToken(null)
            await expect(authService.verifyAccount("randomToken")).rejects.toThrow(
                "Verification Token not found or expired",
            )
        })
        it("should throw if verify token is expired", async () => {
            let expiredToken = { ...validToken, expiredAt: new Date(Date.now() - 60000) }
            mockVerifyTokenExpired(expiredToken)
            await expect(authService.verifyAccount("expiredToken")).rejects.toThrow(
                "Verification Token is expired",
            )
        })
        it("should throw if user not found", async () => {
            let expiredToken = { ...validToken, expiredAt: new Date(Date.now() + 60000) }
            mockVerifyTokenExpired(expiredToken)
            jest.spyOn(User, "findByIdAndUpdate").mockResolvedValue(null as never)
            await expect(authService.verifyAccount("validToken")).rejects.toThrow(
                "User not found or deleted",
            )
        })
        it("should throw if faild create channel", async () => {
            mockVerifiedUser(validToken)
            jest.spyOn(Channel, "create").mockResolvedValue(null as never)
            await expect(authService.verifyAccount("validToken")).rejects.toThrow(
                "Faild to verify account, please try again",
            )
        })
        it("should delete token if is successfully", async () => {
            mockVerifiedUser(validToken)
            jest.spyOn(Channel, "create").mockResolvedValue({ channelId: 1243 } as never)
            jest.spyOn(VerifyToken, "deleteOne").mockResolvedValue({ delete: 1 } as never)
            await authService.verifyAccount("validToken")
            expect(VerifyToken.deleteOne).toHaveBeenCalledTimes(1)
        })
    })

    describe("forgetPassword", () => {
        const user = { _id: "user123", email: "droply@gmail.com" }

        it("should throw if user not found", async () => {
            mockFindUser(null)
            await expect(authService.forgetPassword("droply@gmail.com")).rejects.toThrow()
        })
        it("should delete old tokens and create new one", async () => {
            const sentEmailMock = (await import("../../src/utils/sentEmail")).default as jest.Mock
            sentEmailMock.mockClear()
            jest.spyOn(User, "findOne").mockResolvedValue(user as never)
            const deleteMany = jest
                .spyOn(VerifyToken, "deleteMany")
                .mockResolvedValue({ deletedCount: 1 } as never)
            const create = jest
                .spyOn(VerifyToken, "create")
                .mockResolvedValue({ _id: "token456" } as never)
            await authService.forgetPassword("droply@gmail.com")
            expect(deleteMany).toHaveBeenCalledWith({ userId: "user123", type: "forget-password" })
            expect(create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "forget-password",
                    userId: "user123",
                }),
            )
        })
        it("should call sentEmail with reset link", async () => {
            const sentEmailMock = (await import("../../src/utils/sentEmail")).default as jest.Mock
            sentEmailMock.mockClear()
            jest.spyOn(User, "findOne").mockResolvedValue(user as never)
            jest.spyOn(VerifyToken, "deleteMany").mockResolvedValue({ deletedCount: 1 } as never)
            jest.spyOn(VerifyToken, "create").mockResolvedValue({ _id: "token456" } as never)
            await authService.forgetPassword("droply@gmail.com")
            expect(sentEmailMock).toHaveBeenCalledWith(
                "droply@gmail.com",
                "Forget password email",
                expect.any(String),
            )
        })
    })
    describe("verifyForgetPasswordToken", () => {
        it("check if create progressToken and delete old token", async () => {
            let expiredToken = { ...validToken, expiredAt: new Date(Date.now() + 60000) }
            mockVerifyTokenExpired(expiredToken)
            jest.spyOn(VerifyToken, "create").mockResolvedValue(null as never)
            jest.spyOn(VerifyToken, "deleteOne").mockResolvedValue(null as never)
            await authService.verifyForgetPasswordToken("validToken")
            expect(VerifyToken.deleteOne).toHaveBeenCalledTimes(1)
            expect(VerifyToken.create).toHaveBeenCalledTimes(1)
        })
    })
    describe("Update Password", () => {
        it("check if update user and delete verify token", async () => {
            let expiredToken = { ...validToken, expiredAt: new Date(Date.now() + 60000) }
            mockVerifyTokenExpired(expiredToken)
            jest.spyOn(User, "findOneAndUpdate").mockResolvedValue(null as never)
            jest.spyOn(VerifyToken, "deleteOne").mockResolvedValue(null as never)
            await authService.updatePassword("validToken", "123456789h%^")
            expect(VerifyToken.deleteOne).toHaveBeenCalledTimes(1)
            expect(User.findOneAndUpdate).toHaveBeenCalledTimes(1)
        })
    })
    describe("Send to factor authentication", () => {
        it("should throw error if faild create verify token", async () => {
            mockFindVerifyToken(null)
            jest.spyOn(VerifyToken, "deleteMany").mockResolvedValue(3 as never)
            jest.spyOn(VerifyToken, "create").mockResolvedValue(null as never)
            await expect(
                authService.sendtwoFactorAuthentication({
                    _id: 343,
                    email: "droply@gmail.com",
                } as never),
            ).rejects.toThrow()
        })
        it("should sent email if success", async () => {
            mockFindVerifyToken(null)
            jest.spyOn(VerifyToken, "deleteMany").mockResolvedValue(3 as never)
            jest.spyOn(VerifyToken, "create").mockResolvedValue(validToken as never)
            const sentEmailMock = (await import("../../src/utils/sentEmail")).default as jest.Mock
            sentEmailMock.mockClear()
            await authService.sendtwoFactorAuthentication({
                _id: 343,
                email: "droply@gmail.com",
            } as never)
            expect(sentEmailMock).toHaveBeenCalledWith(
                "droply@gmail.com",
                "Your Droply verification code",
                expect.any(String),
            )
        })
    })
})
