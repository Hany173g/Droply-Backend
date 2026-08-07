import express from "express";
import { uploadVideo, getMyVideos, getPublicVideos, getSingleVideo, updateStatus, refreshUrl, search } from "./videos.contoller.js";
import { protect } from "../../middlewares/auth.js";
import { refreshLimiter } from "../../middlewares/rateLimter.js";
import validate from "../../middlewares/validate.js";
import { createVideoSchema, updateVideoSchema } from "./video.valadtion.js";
import { videoUpload, videoWithThumbnailUpload } from "../../config/multer.js";
const router = express.Router();

router.post("/upload", protect, videoWithThumbnailUpload(), validate(createVideoSchema), uploadVideo);
router.get("/me", protect, getMyVideos);
router.patch("/status/:videoId", protect, validate(updateVideoSchema), updateStatus);
router.post("/refresh/:videoId", protect, refreshLimiter, refreshUrl);
router.get("/single/:videoId", getSingleVideo);
router.get("/search", search);
router.get("/:username", getPublicVideos);
export default router;
