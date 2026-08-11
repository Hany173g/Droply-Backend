import joi from "joi"
import dotenv from "dotenv"
import logger from "../utils/logger.js"

dotenv.config()

const envValidation = joi
    .object({
        // Client
        CLIENT_URL: joi.string().required(),

        // Database
        MONGODB_URL: joi.string().required(),
        // App
        PORT: joi.number().required(),
        NODE_ENV: joi.string().required(),

        // Email
        EMAIL_USER: joi.string().required(),
        EMAIL_PASSWORD: joi.string().required(),

        // Jwt
        JWT_SECRET: joi.string().required(),
        REFRESH_TOKEN_SECRET: joi.string().required(),

        // Cloudinary
        CLOUDINARY_CLOUD_NAME: joi.string().required(),
        CLOUDINARY_API_KEY: joi.number().required(),
        CLOUDINARY_API_SECRET: joi.string().required(),

        // Redis
        REDIS_HOST: joi.string().required(),
        REDIS_PORT: joi.number().required(),
    })
    .unknown(true)

let { error, value } = envValidation.validate(process.env)

if (error) {
    logger.error("Invalid environment variables:", error.message)
    process.exit(1)
}

export const env = {
    client: {
        url: value.CLIENT_URL,
    },
    db: {
        MONGODB_URL: value.MONGODB_URL,
    },
    app: {
        PORT: value.PORT,
        NODE_ENV: value.NODE_ENV,
    },
    email: {
        EMAIL_USER: value.EMAIL_USER,
        EMAIL_PASSWORD: value.EMAIL_PASSWORD,
    },
    jwt: {
        JWT_SECRET: value.JWT_SECRET,
        REFRESH_TOKEN_SECRET: value.REFRESH_TOKEN_SECRET,
    },
    cloudinary: {
        CLOUDINARY_CLOUD_NAME: value.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: value.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: value.CLOUDINARY_API_SECRET,
    },
    redis: {
        REDIS_HOST: value.REDIS_HOST,
        REDIS_PORT: value.REDIS_PORT,
    },
}
