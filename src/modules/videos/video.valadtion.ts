import Joi from "joi";

export const createVideoSchema = Joi.object({
    title: Joi.string().min(10).max(100).required().messages({
        "string.min": "Title must be at least 10 characters",
        "string.max": "Title must not exceed 100 characters",
        "string.empty": "Title is required"
    }),
    description: Joi.string().max(500).allow("").optional().messages({
        "string.max": "Description must not exceed 500 characters"
    }),
    status: Joi.string().valid("public", "private").optional().messages({
        "any.only": "Status must be 'public' or 'private'"
    }),
    type: Joi.string().valid("video", "reels").optional().messages({
        "any.only": "Type must be 'video' or 'reels'"
    })
});

export const updateVideoSchema = Joi.object({
    title: Joi.string().min(10).max(100).optional().messages({
        "string.min": "Title must be at least 10 characters",
        "string.max": "Title must not exceed 100 characters"
    }),
    description: Joi.string().max(500).allow("").optional().messages({
        "string.max": "Description must not exceed 500 characters"
    }),
    status: Joi.string().valid("public", "private").optional().messages({
        "any.only": "Status must be 'public' or 'private'"
    })
}).min(1).messages({
    "object.min": "At least one field must be provided"
});

export const slugSchema = Joi.object({
    slug: Joi.string().required().messages({
        "string.empty": "Slug is required"
    })
});
