import { TenantScopeError } from '../utils/tenantUtils.js';

export function registerErrorHandlers(app) {
  // 404 handler for API and root JSON
  app.use((req, res, next) => {
    if (req.path === '/' || req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not Found' });
    }
    next();
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode ?? 500;
    const isDev = process.env.NODE_ENV !== 'production';

    if (statusCode >= 500) {
      console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
      });
    }

    // Only expose the message for known safe operational errors.
    // Third-party errors with a statusCode < 500 must not leak internals.
    const isSafeError = err instanceof TenantScopeError || err.isOperational === true;
    const message = isSafeError
      ? err.message
      : isDev ? err.message : 'Something went wrong';

    res.status(statusCode).json({ error: message });
  });
}