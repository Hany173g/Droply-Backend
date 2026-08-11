import Joi from "joi"
import { countries, allowLinks } from "../../constants/channel.js"

export const channelIdSchema = Joi.object({
    channelId: Joi.string().hex().length(24).required().messages({
        "string.hex": "Channel ID must be a valid ObjectId",
        "string.length": "Channel ID must be 24 characters",
        "string.required": "Channel ID is required",
    }),
})

const linkSchema = Joi.object({
    link: Joi.string().required().messages({
        "string.required": "Link is required",
    }),
    nameLink: Joi.string()
        .valid(...Object.keys(allowLinks))
        .required()
        .messages({
            "string.required": "Link name is required",
            "any.only": "This site is not supported",
        }),
})

const countryNames = Object.keys(countries)

export const updateMediaSchema = Joi.object({
    type: Joi.string().valid("banner", "photo").required().messages({
        "any.only": "Type must be 'banner' or 'photo'",
        "string.empty": "Type is required",
    }),
})

export const updateChannelSchema = Joi.object({
    data: Joi.object({
        links: Joi.array().items(linkSchema).messages({
            "array.base": "Links must be an array",
        }),
        emailContact: Joi.string().email().allow("").optional().messages({
            "string.email": "This is not a valid email",
        }),
        description: Joi.string().allow("").optional(),
        isPublic: Joi.boolean().messages({
            "boolean.base": "isPublic must be a boolean",
        }),
        location: Joi.object({
            country: Joi.string()
                .valid(...countryNames)
                .required()
                .messages({
                    "string.required": "Country is required",
                    "any.only": "This country is not supported",
                }),
            logoCountry: Joi.string().optional().allow(""),
        }),
    })
        .required()
        .min(1)
        .messages({
            "object.required": "Data is required",
            "object.min": "At least one field must be provided",
        }),
})
