import User from "../../src/modules/user/models/user.model"
import { jest } from "@jest/globals"
import type { UserDocument } from "../../src/modules/user/user.types"
import VerifyToken from "../../src/modules/auth/models/tokenVerify"

export function mockFindUser(user: UserDocument | null) {
    return jest.spyOn(User, "findOne").mockResolvedValue(user as never)
}

export function mockVerifyTokenExpired(validToken: {
    _id: string
    userId: string
    expiredAt: Date
}) {
    return jest.spyOn(VerifyToken, "findOne").mockResolvedValue(validToken as never)
}

export function mockFindVerifyToken(token: string | null) {
    return jest.spyOn(VerifyToken, "findOne").mockResolvedValue(token as never)
}

export function mockVerifiedUser(validToken: any) {
    const token = {
        ...validToken,
        expiredAt: new Date(Date.now() + 60000),
    }

    mockFindVerifyToken(token)

    jest.spyOn(User, "findByIdAndUpdate").mockResolvedValue({ _id: 343, name: "Droply" } as never)

    jest.spyOn(User, "findByIdAndDelete").mockResolvedValue({ isDelete: true } as never)
}
