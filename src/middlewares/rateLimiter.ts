import rateLimter from "express-rate-limit"
import {
    rateLimiterGlobal,
    rateLimiterAuth,
    upload,
    subscriptionLimiterConfig,
    refreshLimiterConfig,
    watchSessionLimiterConfig,
    notificationToggleLimiterConfig,
} from "../constants/rateLimiter.js"

const globalLimiter = rateLimter({
    windowMs: rateLimiterGlobal.window,
    max: rateLimiterGlobal.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
})

const authLimiter = rateLimter({
    windowMs: rateLimiterAuth.window,
    max: rateLimiterAuth.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
})

const uploadLimiter = rateLimter({
    windowMs: upload.window,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
})

const subscriptionLimiter = rateLimter({
    windowMs: subscriptionLimiterConfig.window,
    max: subscriptionLimiterConfig.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
})

const refreshLimiter = rateLimter({
    windowMs: refreshLimiterConfig.window,
    max: refreshLimiterConfig.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
})

const watchSessionLimiter = rateLimter({
    windowMs: watchSessionLimiterConfig.window,
    max: watchSessionLimiterConfig.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
})

const notificationToggleLimiter = rateLimter({
    windowMs: notificationToggleLimiterConfig.window,
    max: notificationToggleLimiterConfig.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
})

export {
    globalLimiter,
    authLimiter,
    uploadLimiter,
    subscriptionLimiter,
    refreshLimiter,
    watchSessionLimiter,
    notificationToggleLimiter,
}
