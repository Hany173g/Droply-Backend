import express from "express"
import {
    getAllCountries,
    getChannel,
    updateChannelInfo,
    updateBannerPhoto,
    handleSubscription,
    toggleNotification,
} from "./channel.controller.js"
import { protect } from "../../middlewares/auth.js"
import validate from "../../middlewares/validate.js"
import { updateChannelSchema, updateMediaSchema, channelIdSchema } from "./channel.validation.js"
import { imageUpload } from "../../config/multer.js"
import { subscriptionLimiter, notificationToggleLimiter } from "../../middlewares/rateLimiter.js"
const router = express.Router()

router.get("/countries", protect, getAllCountries)
router.post(
    "/subscribe/:channelId",
    protect,
    subscriptionLimiter,
    validate(channelIdSchema, "params"),
    handleSubscription,
)
router.patch(
    "/notification/:channelId",
    protect,
    notificationToggleLimiter,
    validate(channelIdSchema, "params"),
    toggleNotification,
)
router.get("/:username", getChannel)
router.put("/update", protect, validate(updateChannelSchema), updateChannelInfo)
router.put(
    "/update/media",
    protect,
    imageUpload("image"),
    validate(updateMediaSchema),
    updateBannerPhoto,
)

export default router
