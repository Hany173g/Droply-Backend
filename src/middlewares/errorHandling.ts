import type { Request, Response, NextFunction } from "express"
import { env } from "../config/env.js"

function duplicateKeyError(err: any, res: Response) {
    res.status(400).json({
        success: false,
        message: `${Object.keys(err.keyValue)[0]} already exists`,
    })
}

function sendToProduction(err: any, res: Response) {
    const statusCode = err.statusCode || 500
    if (err.isOperational) {
        res.status(statusCode).json({
            success: false,
            message: err.message,
        })
    } else {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }
}

export function sendToDevelopment(err: any, res: Response) {
    const statusCode = err.statusCode || 500
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: err.stack,
    })
}

export const globalErrorHandling = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Check for duplicate key error
    if (err.code === 11000) {
        duplicateKeyError(err, res)
        return
    }
    if (env.app.NODE_ENV === "production") {
        sendToProduction(err, res)
    } else {
        sendToDevelopment(err, res)
    }
    next()
}
