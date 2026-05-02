import moduleRoutes from '../modules/routes.js';
import { registerSwagger } from './swagger.routes.js';

export function registerRoutes(app) {
  // Swagger UI + raw spec (gated by SWAGGER_ENABLED env var)
  registerSwagger(app);

  // Health check — registered before module routes so it is never shadowed
  app.get('/api/v1/health', (req, res) => {
    res.json({
      status:    'OK',
      timestamp: new Date().toISOString(),
      version:   process.env.npm_package_version ?? 'unknown',
      env:       process.env.NODE_ENV ?? 'development',
      // Token config — shows the actual values the running server is using.
      // Useful for diagnosing short-token issues on hosted deployments where
      // env vars are set in web.config / hosting dashboard, not in .env.
      tokenConfig: {
        accessTokenExpiry:  process.env.ACCESS_TOKEN_EXPIRES_IN  ?? '15m (default)',
        refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d (default)',
        // Confirm the secrets are set (never log the actual values)
        jwtSecretSet:          !!process.env.JWT_SECRET,
        refreshSecretSet:      !!process.env.REFRESH_TOKEN_SECRET,
        secretsAreDifferent:   !!(
          process.env.JWT_SECRET &&
          process.env.REFRESH_TOKEN_SECRET &&
          process.env.JWT_SECRET !== process.env.REFRESH_TOKEN_SECRET
        ),
      },
    });
  });

  // Legacy health check redirect for backward compatibility
  app.get('/api/health', (req, res) => res.redirect('/api/v1/health'));

  // Redirect root to Swagger docs
  app.get('/', (req, res) => res.redirect('/api/docs'));

  // All API routes under /api/v1
  app.use('/api/v1', moduleRoutes);

  // Legacy API redirect for backward compatibility (temporary)
  app.use('/api', (req, res, next) => {
    // Skip if it's already a v1 path or a docs/health path
    if (req.path.startsWith('/v1') || req.path.startsWith('/docs') || req.path === '/health') {
      return next();
    }
    // Redirect to v1 with a deprecation warning
    const newUrl = `/api/v1${req.originalUrl.replace('/api', '')}`;
    res.status(301).header('X-API-Deprecation', 'This endpoint is deprecated. Use /api/v1/ instead.').redirect(newUrl);
  });

  // Non-API paths redirect to docs — API 404s are handled by the global
  // error handler in errors/index.js (registerErrorHandlers)
  app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.redirect('/api/docs');
    }
  });
}
