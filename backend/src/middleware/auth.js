import { extractBearerToken, verifyAccessToken } from '../utils/tokenService.js';

/**
 * Authenticate token middleware
 * Extracts and verifies JWT from Authorization header
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const payload = verifyAccessToken(token);
    
    // Debug logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Token verified. Payload:', {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId ?? null,
        hasUserId: !!payload.userId,
      });
      console.log('req.user set to:', payload); // Added for debugging
    }
    
    req.user = payload;

    // Ensure tenantId is always present on req.user for tenant-scoped roles.
    // If the token doesn't include tenantId, load it from DB.
    if ((payload.role === 'TENANT_ADMIN' || payload.role === 'EMPLOYEE') && !payload.tenantId) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Token missing tenantId for tenant-scoped role. Loading from DB...', {
          userId: payload.userId,
          role: payload.role,
        });
      }

      // Lazy import to avoid circular deps at module load time
      const { db } = await import('../config/database.js');
      const { users } = await import('../modules/users/users.schema.js');
      const { eq } = await import('drizzle-orm');

      const [row] = await db.select({ tenantId: users.tenantId }).from(users).where(eq(users.id, payload.userId)).limit(1);
      if (row?.tenantId) {
        req.user.tenantId = row.tenantId;
      }
    }

    next();
  } catch (error) {
    const statusCode = error.message.includes('expired') ? 401 : 401;
    const message = error.message.includes('expired')
      ? 'Token expired'
      : 'Invalid token';

    console.error('Token verification error:', error.message);
    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Require admin role middleware
 */
export const requireTenantAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'TENANT_ADMIN') {
    return res.status(403).json({ error: 'Tenant admin access required' });
  }

  // Tenant admins must always operate within their own tenant context.
  // We rely on resolveTenant middleware to set req.tenantId.
  const tokenTenantId = req.user.tenantId ?? null;
  const requestTenantId = req.tenantId ?? null;

  if (!tokenTenantId) {
    return res.status(403).json({ error: 'Tenant admin is missing tenantId' });
  }

  // If request has no tenant context, default it to the token tenant.
  // This prevents accidental cross-tenant reads when the client forgets the header.
  if (!requestTenantId) {
    req.tenantId = tokenTenantId;
    return next();
  }

  // If request tenant context is present, it must match the token tenant.
  if (String(requestTenantId) !== String(tokenTenantId)) {
    return res.status(403).json({ error: 'Cross-tenant access denied' });
  }

  next();
};

/**
 * Require admin role middleware (super admin OR tenant admin)
 *
 * Note: Prefer using requireTenantAdmin / requireSuperAdmin for stricter access.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Require super admin role middleware
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};
