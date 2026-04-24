import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.js';

/**
 * Registers Swagger UI and the raw OpenAPI JSON spec.
 *
 * - UI:   GET /api/docs
 * - JSON: GET /api/docs.json
 *
 * The UI is always enabled. To disable in production set SWAGGER_ENABLED=false.
 *
 * How to run requests:
 *  1. Call POST /api/auth/login to get a token
 *  2. Click "Authorize" (top right) and paste: Bearer <token>
 *  3. Optionally add X-Tenant-Slug in the global header input
 *  4. Click "Try it out" on any endpoint → "Execute"
 */
export function registerSwagger(app) {
  if (process.env.SWAGGER_ENABLED === 'false') return;

  // Raw spec — useful for code generation and external tooling
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(swaggerSpec);
  });

  // Interactive UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        // Keep the token across page refreshes
        persistAuthorization:   true,
        // Show how long each request took
        displayRequestDuration: true,
        // Open "Try it out" mode by default on every endpoint
        tryItOutEnabled:        true,
        // Collapse all tags by default so the page isn't overwhelming
        docExpansion:           'none',
        // Show request duration and response headers
        showExtensions:         true,
        showCommonExtensions:   true,
        // Deep link — URL updates as you navigate so you can share a link to a specific endpoint
        deepLinking:            true,
        // Pre-fill the server URL so requests go to the right place
        defaultModelsExpandDepth: -1,  // hide schemas section by default (less noise)
      },
      // Custom page title
      customSiteTitle: 'Ticket Management API',
    }),
  );
}
