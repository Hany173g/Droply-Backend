import express from "express"
import type { Request, Response, NextFunction } from "express"

const router = express.Router()

router.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ success: true })
})

export default router
