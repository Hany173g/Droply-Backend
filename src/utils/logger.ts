import winston from "winston"

const isProduction = process.env.NODE_ENV === "production"

const logger = winston.createLogger({
    level: isProduction ? "info" : "debug",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        isProduction
            ? winston.format.json()
            : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    ),
    defaultMeta: { service: "droply" },
    transports: [
        new winston.transports.Console(),
        ...(isProduction
            ? [
                  new winston.transports.File({
                      filename: "logs/error.log",
                      level: "error",
                      maxsize: 5 * 1024 * 1024, 
                      maxFiles: 5,
                  }),
                  new winston.transports.File({
                      filename: "logs/combined.log",
                      maxsize: 10 * 1024 * 1024,
                      maxFiles: 10,
                  }),
              ]
            : []),
    ],
})

export default logger
