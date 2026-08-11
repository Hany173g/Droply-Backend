export class ApiError extends Error {
    public isOperational: boolean
    public statusCode: number
    stack?: string
    constructor(message: string, statusCode: number) {
        super(message)
        this.isOperational = true
        this.statusCode = statusCode
        Error.captureStackTrace(this, this.constructor)
    }
    static badRequest(message: string = "Bad Request") {
        return new ApiError(message, 400)
    }
    static unAuthorized(message: string = "UnAuthorized") {
        return new ApiError(message, 401)
    }
    static forbidden(message: string = "forbidden") {
        return new ApiError(message, 403)
    }
    static notFound(message: string = "Not Found") {
        return new ApiError(message, 404)
    }
    static methodNotAllow(message: string = "Method Not Allowed") {
        return new ApiError(message, 405)
    }
    static conflict(message: string = "Conflict") {
        return new ApiError(message, 409)
    }
    static unprocessableEntity(message: string = "Unprocessable Entity") {
        return new ApiError(message, 422)
    }
    static rateLimiter(message: string = "Too Many Requests") {
        return new ApiError(message, 429)
    }
    static internal(message: string = "Internal Server Error") {
        return new ApiError(message, 500)
    }
    static overLoad(message: string = "Service Unavailable") {
        return new ApiError(message, 503)
    }
}
