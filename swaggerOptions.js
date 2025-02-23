const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Agents API",
      description: "API for managing agents with CRUD operations",
      version: "1.0.0",
      contact: {
        name: "Support Team",
        email: "support@example.com",
        url: "https://example.com"
      }
    },
    servers: [
      {
        url: "138.197.71.145:3000",
        description: "Local development server"
      },
      {
        url: "https://api.example.com",
        description: "Production server"
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ["./routes/*.js"] // Path to your route files for Swagger documentation
};

module.exports = options;

