import moduleRoutes from '../modules/routes.js';
import { registerSwagger } from './swagger.routes.js';

export function registerRoutes(app) {
  // Swagger UI + raw spec (gated by SWAGGER_ENABLED env var)
  registerSwagger(app);

  // Health check — registered before module routes so it is never shadowed
  app.get('/api/health', (req, res) => {
    res.json({
      status:    'OK',
      timestamp: new Date().toISOString(),
      version:   process.env.npm_package_version ?? 'unknown',
      env:       process.env.NODE_ENV ?? 'development',
    });
  });

  // Redirect root to Swagger docs
  app.get('/', (req, res) => res.redirect('/api/docs'));

  // All API routes under /api
  app.use('/api', moduleRoutes);

  // Non-API paths redirect to docs — API 404s are handled by the global
  // error handler in errors/index.js (registerErrorHandlers)
  app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.redirect('/api/docs');
    }
  });
}
