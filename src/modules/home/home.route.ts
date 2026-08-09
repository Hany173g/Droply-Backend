import express from "express"
import { homeFeed, shorts } from "./home.contoller.js"

const router = express.Router()

router.get("/feed", homeFeed)
router.get("/shorts", shorts)

export default router
