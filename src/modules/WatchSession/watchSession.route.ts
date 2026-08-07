import express from "express";
import { createSession, trackSession, history } from "./watchSession.contoller.js";
import validate from "../../middlewares/validate.js";
import { createWatchSessionSchema, watchingTrackSchema } from "./watchSession.valadtion.js";
import { watchSessionLimiter } from "../../middlewares/rateLimter.js";
import { protect } from "../../middlewares/auth.js";

const router = express.Router();

router.post("/create", watchSessionLimiter, validate(createWatchSessionSchema), createSession);
router.post("/track", watchSessionLimiter, validate(watchingTrackSchema), trackSession);
router.get("/history", protect, history);

export default router;
