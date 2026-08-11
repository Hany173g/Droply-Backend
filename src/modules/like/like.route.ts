import express from "express"
import { toggle, check } from "./like.controller.js"
import { protect } from "../../middlewares/auth.js"
import validate from "../../middlewares/validate.js"
import { targetSchema } from "./like.validation.js"
const router = express.Router()

router.post("/toggle", protect, validate(targetSchema), toggle)
router.get("/check/:targetType/:targetId", protect, validate(targetSchema, "params"), check)

export default router
