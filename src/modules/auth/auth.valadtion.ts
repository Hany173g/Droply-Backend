import Joi from "joi";
import {userValadtion} from "../../constants/user.js"
import VerifyToken from "./models/tokenVerify.js";


export const registerSchema = Joi.object({
    name: Joi.string()
    .required()
    .min(userValadtion.name.min)
    .max(userValadtion.name.max)
    .messages({
        "string.required":"Name is required",
        "string.min":`Name must be min ${userValadtion.name.min} and max ${userValadtion.name.max}`, 
        "string.max":`Name must be min ${userValadtion.name.min} and max ${userValadtion.name.max}` 
    }),
    password: Joi.string()
    .required()
    .min(userValadtion.password.min)
    .max(userValadtion.password.max)
    .messages({
        "string.required":"Password is required",
        "string.min":`Password must be min ${userValadtion.password.min} and max ${userValadtion.password.max}`, 
        "string.max":`Password must be min ${userValadtion.password.min} and max ${userValadtion.password.max}`
    }),
    email: Joi.string()
    .required()
    .messages({
        "string.required":"Email is required"
    })
})



export const verifyAccountSchema = Joi.object({
    verifyToken: Joi.string().required().messages({
        "string.empty": "Verification token is required"
    })
})


export const forgetPasswordSchema = Joi.object({
    email: Joi.string().required().email().messages({
        "string.required":"Email is required",
        "string.email":"This is not a valid email",
    })
})


export const passwordValadtion = Joi.object({
    password: Joi.string().required().messages({
        "string.required":"Password is required" ,
    })
})

export const loginSchema = Joi.object({
    email: Joi.string().required().email().messages({
        "string.required":"Email is required",
        "string.email":"This is not a valid email",
    }),
    password: Joi.string().required().messages({
        "string.required":"Password is required"
    })
})

export const twoFactorAuthenticationVerificationSchema = Joi.object({
    token: Joi.string().required().messages({
        "string.required":"Token is required",
    }),
    verificationId: Joi.string().required().messages({
        "string.required":"Verification ID is required",
    }),
})
