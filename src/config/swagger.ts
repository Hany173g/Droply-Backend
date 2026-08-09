import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env.js";
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Droply API",
      version: "1.0.0",
      description: "REST API for Droply",
    },
    servers: [
      {
        url: `http://localhost:${env.app.PORT}/api/v1`,
        description: "Development server",
      },
    ],
  },

  apis: [
  "./src/docs/*.docs.ts",
  "./src/docs/schemas/*.schemas.ts",
]
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);