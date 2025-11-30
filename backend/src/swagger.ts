import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import { Express } from "express";

dotenv.config();

export function setupSwagger(app: Express) {
  const ngrokUrl = process.env.NGROK_URL;

  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Messaging API",
        version: "1.0.0",
        description: "API documentation for your messaging backend",
      },
      servers: [
        {
          url: "http://localhost:5000",
          description: "Local server",
        },
        ...(ngrokUrl
          ? [
              {
                url: `${ngrokUrl}/api`,
                description: "Public (via ngrok)",
              },
            ]
          : []),
      ],
    },

    apis: ["./src/controllers/**/*.ts", "./src/routes/**/*.ts"],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
 app.get("/api/docs/swagger.json", (req, res) => {
    res.json(swaggerSpec);
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 
  if (ngrokUrl) {
    console.log(`Swagger Docs available at: ${ngrokUrl}/api/docs`);
  }
  console.log(`Swagger Docs available at: http://localhost:5000/api/docs`);
}
