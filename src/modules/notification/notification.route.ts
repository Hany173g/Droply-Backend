import express from "express";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "./notification.contoller.js";
import { protect } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.patch("/read/:notificationId", protect, markAsRead);
router.patch("/read-all", protect, markAllAsRead);
router.delete("/:notificationId", protect, deleteNotification);

export default router;
