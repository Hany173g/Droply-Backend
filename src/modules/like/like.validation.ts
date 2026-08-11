import Joi from "joi"

export const targetSchema = Joi.object({
    targetId: Joi.string().hex().length(24).required().messages({
        "string.hex": "Target ID must be a valid ObjectId",
        "string.length": "Target ID must be 24 characters",
        "string.required": "Target ID is required",
    }),
    targetType: Joi.string().required().messages({
        "string.required": "Target type is required",
    }),
    type: Joi.string().valid("like", "dislike").optional().messages({
        "any.only": "Type must be 'like' or 'dislike'",
    }),
})
