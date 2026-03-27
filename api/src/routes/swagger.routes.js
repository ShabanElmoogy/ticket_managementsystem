import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.js';

/**
 * Registers Swagger UI and the raw OpenAPI JSON.
 *
 * - UI:   GET /api/docs
 * - JSON: GET /api/docs.json
 */
export function registerSwagger(app) {
  // Raw spec
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(swaggerSpec);
  });

  // UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    })
  );
}
