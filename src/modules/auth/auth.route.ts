import express from "express"
import {
    verify,
    register,
    login,
    forgetPassword,
    refresh,
    twoFactorAuthenticationVerification,
    verifyForgetPasswordToken,
    updatePassword,
} from "./auth.controller.js"
import validate from "../../middlewares/validate.js"
import {
    registerSchema,
    verifyAccountSchema,
    loginSchema,
    twoFactorAuthenticationVerificationSchema,
    forgetPasswordSchema,
    passwordValadtion,
} from "./auth.validation.js"
const router = express.Router()

router.post("/register", validate(registerSchema), register)
router.post("/verify-account/:verifyToken", validate(verifyAccountSchema, "params"), verify)
router.post("/forget-password", validate(forgetPasswordSchema), forgetPassword)
router.post(
    "/verifyForgetPasswordToken/:verifyToken",
    validate(verifyAccountSchema, "params"),
    verifyForgetPasswordToken,
)
router.post(
    "/updatePassword/:verifyToken",
    validate(verifyAccountSchema, "params"),
    validate(passwordValadtion),
    updatePassword,
)
router.post("/login", validate(loginSchema), login)
router.post("/refresh", refresh)
router.post(
    "/twoFactorAuthentication",
    validate(twoFactorAuthenticationVerificationSchema),
    twoFactorAuthenticationVerification,
)
export default router
