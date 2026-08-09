import type { ITokenPayload } from "../modules/auth/auth.types.js"

declare global {
    namespace Express {
        interface Request {
            user: ITokenPayload
        }
    }
}

export {}
