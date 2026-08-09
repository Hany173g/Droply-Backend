import Joi from "joi"

export const createCommentSchema = Joi.object({
    targetId: Joi.string().hex().length(24).required().messages({
        "string.hex": "Target ID must be a valid ObjectId",
        "string.length": "Target ID must be 24 characters",
        "string.required": "Target ID is required",
    }),
    targetType: Joi.string().required().messages({
        "string.required": "Target type is required",
    }),
    content: Joi.string().trim().min(1).max(1000).required().messages({
        "string.empty": "Comment content is required",
        "string.min": "Comment must be at least 1 character",
        "string.max": "Comment must not exceed 1000 characters",
        "string.required": "Comment content is required",
    }),
}).options({ allowUnknown: true })

export const commentIdSchema = Joi.object({
    commentId: Joi.string().hex().length(24).required().messages({
        "string.hex": "Comment ID must be a valid ObjectId",
        "string.length": "Comment ID must be 24 characters",
        "string.required": "Comment ID is required",
    }),
})

export const targetSchema = Joi.object({
    targetId: Joi.string().hex().length(24).required().messages({
        "string.hex": "Target ID must be a valid ObjectId",
        "string.length": "Target ID must be 24 characters",
        "string.required": "Target ID is required",
    }),
    targetType: Joi.string().required().messages({
        "string.required": "Target type is required",
    }),
})
