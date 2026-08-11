import express from "express"
import { homeFeed, shorts } from "./home.controller.js"

const router = express.Router()

router.get("/feed", homeFeed)
router.get("/shorts", shorts)

export default router
