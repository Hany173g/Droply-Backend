import express from "express"
import { create, remove, get } from "./comment.controller.js"
import { protect } from "../../middlewares/auth.js"
import validate from "../../middlewares/validate.js"
import { createCommentSchema, commentIdSchema } from "./comment.validation.js"
const router = express.Router()

router.post("/", protect, validate(createCommentSchema), create)
router.delete("/:commentId", protect, validate(commentIdSchema, "params"), remove)
router.get("/:targetType/:targetId", get)

export default router
