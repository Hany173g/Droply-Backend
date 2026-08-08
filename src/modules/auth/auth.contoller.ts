import type { Request,  Response , NextFunction } from "express";
import asyncHandler from "../../middlewares/asyncHandler.js"
import {Register,verifyAccount  , twoFactorAuthenticationFlow, refresh as refreshSevice , forgetPassword as forgetPasswordService ,login as loginService, updatePassword as updatePasswordService ,verifyForgetPasswordToken as verifyForgetPasswordTokenService } from "./auth.service.js"
import {env} from "../../config/env.js"




export const register = asyncHandler(async (req : Request , res : Response , next : NextFunction) => {
    const {name , password,email} = req.body
    let acceptLanguage = req.headers['accept-language']
    await Register(name,password,email,acceptLanguage)
    res.status(201).json({
        message:"Account created successfully. Please check your email to verify your account.",
        success:true
    })
})


export const verify = asyncHandler(async (req : Request , res : Response , next : NextFunction) => {
    const {verifyToken} = req.params
    await verifyAccount(verifyToken as string)
    res.status(200).json({
        message:"Account is verify",
        success:true
    })
})


export const forgetPassword = asyncHandler(async(req : Request , res : Response , next : NextFunction) => {
    const {email} = req.body
    await forgetPasswordService(email)
    res.status(200).json({
        message:"Please check your email to reset your account.",
        success:true
    })
})




export const verifyForgetPasswordToken = asyncHandler(async(req : Request , res : Response , next : NextFunction) => {
    const {verifyToken} = req.params
    let progressToken = await verifyForgetPasswordTokenService(verifyToken as string)
    res.status(200).json({progressToken , success:true})
})




export const updatePassword = asyncHandler(async (req : Request , res : Response , next : NextFunction) => {
    const {verifyToken} = req.params
    const {password} = req.body
    await updatePasswordService(verifyToken as string , password as string)
    res.status(200).json({
        message:"Success update password" ,
        success:true
    })
})



export const login = asyncHandler(async (req : Request , res : Response , next : NextFunction) => {
    const {email , password} = req.body
    let responseSchema = {

    }
    let loginData = await loginService(email , password , req.headers['user-agent'] || "unknown" , req.ip || "unknown")
    if (loginData.isTwoAuth) {
        responseSchema = {
            message: "Please check your email" , 
            success:true,
            verificationId:loginData.verificationId
        }
    } else {
        res.cookie('refreshToken' , loginData.refreshToken, {
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/v1/auth/refresh'
        })
        responseSchema = {
            accessToken:loginData.accessToken,
            success:true ,
            message: "Login is successfully"
        }
    }   
    res.status(200).json(responseSchema)
})



export const refresh = asyncHandler(async (req : Request , res : Response , next : NextFunction) => {
    const refreshToken = req.cookies.refreshToken
    let accessToken  = await refreshSevice(refreshToken)
    res.status(200).json({success:refreshToken , accessToken})
})




export const twoFactorAuthenticationVerification = asyncHandler(async (req : Request , res : Response , next : NextFunction) => {
    const {token , verificationId} = req.body
    const {accessToken , refreshToken} = await twoFactorAuthenticationFlow(token,verificationId,req.headers['user-agent'] || "unknown" , req.ip || "unknown")
    res.status(200).json({accessToken,refreshToken})
})