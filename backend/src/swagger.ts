import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";


export function setupSwagger(app: Express, yourIP: string, port: number) {
  const ngrokUrl = process.env.NGROK_URL;

  const servers = [
    { url: `http://${yourIP}:${port}`, description: "Mobile Access (Your IP)" },
    { url: `http://localhost:${port}`, description: "Local Development" },
    ...(ngrokUrl ? [{ url: `${ngrokUrl}`, description: "Public (Ngrok)" }] : []),
  ];

  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Messaging API",
        version: "1.0.0",
        description: "API documentation for your messaging backend",
      },
      servers: servers, 
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ["./src/controllers/**/*.ts", "./src/routes/**/*.ts"],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  // Optional: Serve raw JSON
  app.get("/api/docs/swagger.json", (req, res) => res.json(swaggerSpec));

  const uiOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      urls: [
        {
          url: `/api/docs/swagger.json`,
          name: "API v1",
        },
      ],
    },
  };

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, uiOptions)
  );

  console.log(`
📚 SWAGGER DOCS AVAILABLE AT:
   Mobile:    http://${yourIP}:${port}/api/docs
   Local:     http://localhost:${port}/api/docs
   ${ngrokUrl ? `Public:    ${ngrokUrl}/api/docs` : ""}
`);
}