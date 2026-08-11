import express from "express"
import { createSession, trackSession, history } from "./watchSession.controller.js"
import validate from "../../middlewares/validate.js"
import { createWatchSessionSchema, watchingTrackSchema } from "./watchSession.validation.js"
import { watchSessionLimiter } from "../../middlewares/rateLimiter.js"
import { protect } from "../../middlewares/auth.js"

const router = express.Router()

router.post("/create", watchSessionLimiter, validate(createWatchSessionSchema), createSession)
router.post("/track", watchSessionLimiter, validate(watchingTrackSchema), trackSession)
router.get("/history", protect, history)

export default router
