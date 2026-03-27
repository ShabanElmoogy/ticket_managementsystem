import { Role } from '../constants/roles.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * HTTP-safe error for tenant scope violations.
 * The global error handler reads err.statusCode to respond correctly
 * without each controller needing its own try/catch.
 */
export class TenantScopeError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.name = 'TenantScopeError';
    this.statusCode = statusCode;
  }
}

/**
 * Validates and returns a trimmed UUID string.
 * Throws TenantScopeError (400) if the value is present but malformed.
 * Returns null if the value is absent.
 */
const validateUuid = (value) => {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!UUID_RE.test(v)) {
    throw new TenantScopeError('Invalid tenantId format', 400);
  }
  return v;
};

/**
 * Resolves the tenant scope from the request.
 *
 * Returns a discriminated union — never a raw null — so callers are
 * forced to handle both cases deliberately:
 *   { type: 'GLOBAL' }              → SUPER_ADMIN with no tenant header (sees all tenants)
 *   { type: 'TENANT', tenantId }    → scoped to a specific tenant
 *
 * Throws TenantScopeError (401) if req.user is not set (unauthenticated).
 * Throws TenantScopeError (400) if a tenantId header value is not a valid UUID.
 * Throws TenantScopeError (403) if a non-SUPER_ADMIN sends a header tenant
 * that contradicts the tenant embedded in their JWT.
 * Throws TenantScopeError (403) if a non-SUPER_ADMIN has no resolvable tenantId.
 */
export const getTenantScope = (req) => {
  if (!req?.user) {
    throw new TenantScopeError('Unauthenticated request', 401);
  }

  const isSuperAdmin = req.user.role === Role.SUPER_ADMIN;

  if (isSuperAdmin) {
    // validateUuid throws 400 if the header value is present but malformed.
    const tenantId = validateUuid(req.tenantId);
    return tenantId
      ? { type: 'TENANT', tenantId }
      : { type: 'GLOBAL' };
  }

  // All other roles: JWT is the sole authority on tenantId.
  // Header is never used as a fallback — only the signed token is trusted.
  const tokenTenantId = validateUuid(req.user.tenantId);
  const headerTenantId = validateUuid(req.tenantId);

  // Reject if the client sends a header tenant that contradicts their signed token.
  // This closes the EMPLOYEE cross-tenant header injection vector.
  if (headerTenantId && tokenTenantId && headerTenantId !== tokenTenantId) {
    throw new TenantScopeError('Cross-tenant access denied', 403);
  }

  // Header is ignored for non-SUPER_ADMIN — tenantId must come from the token.
  if (!tokenTenantId) {
    throw new TenantScopeError('Tenant context required', 403);
  }

  return { type: 'TENANT', tenantId: tokenTenantId };
};

/**
 * Like getTenantScope but throws TenantScopeError (403) if the resolved
 * scope is GLOBAL (i.e. SUPER_ADMIN without a tenant header).
 *
 * Use this on endpoints that must always operate within a single tenant.
 * Returns the tenantId string directly.
 */
export const requireTenantScope = (req) => {
  const scope = getTenantScope(req);
  if (scope.type !== 'TENANT') {
    throw new TenantScopeError('Tenant context required', 403);
  }
  return scope.tenantId;
};

/**
 * Express middleware that resolves and attaches req.tenantScope.
 * Fails fast (before the controller runs) so tenant enforcement is
 * declarative and impossible to forget.
 *
 * Use for routes where SUPER_ADMIN global scope is acceptable (reads).
 *
 * Usage:
 *   router.get('/', authenticateToken, enforceTenantScope, controller.getAll);
 *   // controller reads: req.tenantScope  → { type: 'GLOBAL' } | { type: 'TENANT', tenantId }
 */
export const enforceTenantScope = (req, res, next) => {
  try {
    req.tenantScope = getTenantScope(req);
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Express middleware that resolves tenant scope AND requires it to be
 * scoped to a specific tenant (never GLOBAL).
 * Use on all write routes and any read that must be tenant-scoped.
 *
 * Usage:
 *   router.post('/', authenticateToken, requireTenantScopeMiddleware, controller.create);
 *   // controller reads: req.tenantScope.tenantId
 */
export const requireTenantScopeMiddleware = (req, res, next) => {
  try {
    const tenantId = requireTenantScope(req);
    req.tenantScope = { type: 'TENANT', tenantId };
    next();
  } catch (err) {
    next(err);
  }
};
