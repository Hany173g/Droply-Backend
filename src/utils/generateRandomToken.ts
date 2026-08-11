import crypto from "crypto"

export function generateToken(): string {
    return crypto.randomBytes(32).toString("hex")
}

export function generateCode(length = 8) {
    const chars = "0123456789"
    let code = ""
    for (let i = 0; i < length; i++) {
        code += chars.charAt(crypto.randomInt(0, chars.length))
    }
    return code
}
