import express from "express"
import type {Request , Response , NextFunction} from "express"
import cors from "cors"
import { ApiError } from "./utils/ApiError.js"
import hpp from "hpp"
import compression from "compression"
import cookieParser from "cookie-parser"
import { globalLimiter,authLimiter } from "./middlewares/rateLimter.js"
import {globalErrorHandling} from "./middlewares/errorHandling.js"
import {env} from "./config/env.js"
let app = express()

app.use(cors({ origin: env.client.url, credentials: true }))




// ── Body Parsing ──────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));



// ── Security ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  const sanitize = (obj : Record<string,any>) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      });
    }
  };
  sanitize(req.body);
  sanitize(req.params);
  sanitize(req.query);
  next();
}); // Prevent NoSQL injection


// Safe From HTTP Parameter Pollution Attack
app.use(hpp())




// ── Compression ───────────────────────────────────────
app.use(compression());



// ── Cookie Parsing ─────────────────────────────────────
app.use(cookieParser());



app.use(globalLimiter)

// Api Health

import healthRouter from "./modules/health/health.route.js"

app.use("/api/v1/health", healthRouter)

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

if (env.app.NODE_ENV !== "Production") {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  )
}



// Auth Routes
import authRouter from "./modules/auth/auth.route.js"

app.use("/api/v1/auth",authLimiter,authRouter)

// Channel Routes
import channelRouter from "./modules/channel/channel.route.js"

app.use("/api/v1/channel", channelRouter)

// Video Routes
import videoRouter from "./modules/videos/video.route.js"

app.use("/api/v1/video", videoRouter)

// Like Routes
import likeRouter from "./modules/like/like.route.js"

app.use("/api/v1/like", likeRouter)

// Comment Routes
import commentRouter from "./modules/comment/comment.route.js"

app.use("/api/v1/comment", commentRouter)

// WatchSession Routes
import watchSessionRouter from "./modules/WatchSession/watchSession.route.js"

app.use("/api/v1/watch-session", watchSessionRouter)

// Home Routes
import homeRouter from "./modules/home/home.route.js"

app.use("/api/v1/home", homeRouter)

// Notification Routes
import notificationRouter from "./modules/notification/notification.route.js"

app.use("/api/v1/notification", notificationRouter)



app.use((req: Request , res : Response , next : NextFunction) => {
   next(ApiError.notFound(`This route not found  ${req.originalUrl} 404`))
})

app.use(globalErrorHandling)

export default app










