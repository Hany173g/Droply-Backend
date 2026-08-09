import Joi from "joi"

export const createWatchSessionSchema = Joi.object({
    userVideoId: Joi.string().hex().length(24).required().messages({
        "string.hex": "Video ID must be a valid ObjectId",
        "string.length": "Video ID must be 24 characters",
        "any.required": "Video ID is required",
    }),
})

export const watchingTrackSchema = Joi.object({
    token: Joi.string().required().messages({
        "any.required": "Token is required",
    }),
    timeWatching: Joi.number().min(0).required().messages({
        "number.base": "timeWatching must be a number",
        "number.min": "timeWatching must be at least 0",
        "any.required": "timeWatching is required",
    }),
    userVideoId: Joi.string().hex().length(24).required().messages({
        "string.hex": "Video ID must be a valid ObjectId",
        "string.length": "Video ID must be 24 characters",
        "any.required": "Video ID is required",
    }),
})
