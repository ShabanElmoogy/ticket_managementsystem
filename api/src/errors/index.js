import { TenantScopeError } from '../utils/tenantUtils.js';

// ── Safe error codes allowlist ────────────────────────────────────────────────
// Only codes in this set are ever included in the HTTP response body.
// Add new codes here deliberately — never reflect arbitrary error.errorCode.

const SAFE_ERROR_CODES = new Set([
  'ASSOCIATED_DATA', // User/entity has related records — triggers force-delete flow
]);

// ── Controller error handler ──────────────────────────────────────────────────

/**
 * Standard error handler for all controllers.
 * Forwards error.status / error.statusCode to the response, defaults to 500.
 * Logs 5xx at error level, 4xx at warn level.
 *
 * @param {import('express').Response} res
 * @param {Error} error
 * @param {string} context - Operation name for logging (e.g. 'Create user')
 */
export function handleError(res, error, context) {
  const status = error.status ?? error.statusCode ?? 500;

  if (status >= 500) {
    // Log the full error including the underlying cause (e.g. DrizzleQueryError wraps a PostgresError)
    console.error(`${context} error:`, error.message);
    if (error.cause) console.error(`${context} cause:`, error.cause?.message ?? error.cause);
  } else if (status >= 400) {
    console.warn(`${context} [${status}]:`, error.message);
  }

  const message  = error.message ?? 'Internal server error';
  // Only expose errorCode when it is in the known-safe allowlist
  const safeCode = SAFE_ERROR_CODES.has(error.errorCode) ? error.errorCode : undefined;
  // cause may contain internal details (DB errors, upstream messages) —
  // only include in non-production environments for debugging
  const isDev    = process.env.NODE_ENV !== 'production';
  const cause    = isDev ? (error.cause?.message ?? null) : null;

  res.status(status).json({
    error: message,
    ...(safeCode ? { errorCode: safeCode } : {}),
    ...(cause    ? { cause }              : {}),
  });
}

export function registerErrorHandlers(app) {

  // ── 404 handler ─────────────────────────────────────────────────────────────
  // Catches any request that fell through all routes without a match.
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'Not Found' });
    }
    next();
  });

  // ── Global error handler ─────────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // Normalise status — service errors use .status, TenantScopeError uses .statusCode
    const statusCode = err.status ?? err.statusCode ?? 500;
    const isDev      = process.env.NODE_ENV !== 'production';

    // Log 5xx errors with structured payload
    if (statusCode >= 500) {
      const logPayload = {
        message: err.message,
        url:     req.url,
        method:  req.method,
      };
      if (isDev) logPayload.stack = err.stack;
      console.error(JSON.stringify(logPayload));
    }

    // Safe errors: message is intentional and safe to expose to the client.
    //   - TenantScopeError  — thrown by tenant middleware
    //   - isOperational     — explicitly flagged by the thrower
    //   - status < 500      — service fail() errors (404, 403, 400, 409, etc.)
    const isSafeError = err instanceof TenantScopeError
      || err.isOperational === true
      || (err.status != null && err.status < 500);

    const message = isSafeError
      ? err.message
      : isDev ? err.message : 'Something went wrong';

    res.status(statusCode).json({ error: message });
  });
}
