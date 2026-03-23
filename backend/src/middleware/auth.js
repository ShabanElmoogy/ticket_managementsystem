import { extractBearerToken, verifyAccessToken } from '../utils/tokenService.js';
import { Role } from '../constants/roles.js';

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
    req.user = payload;
    next();
  } catch (error) {
    const message = error.message.includes('expired') ? 'Token expired' : 'Invalid token';
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: message });
  }
};

/**
 * Require tenant admin role middleware.
 * Cross-tenant header validation is handled by getTenantScope in tenantUtils.
 */
export const requireTenantAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== Role.TENANT_ADMIN) {
    return res.status(403).json({ error: 'Tenant admin access required' });
  }

  if (!req.user.tenantId) {
    return res.status(403).json({ error: 'Tenant admin is missing tenantId' });
  }

  next();
};

/**
 * Require admin role middleware (super admin OR tenant admin)
 *
 * Note: Prefer using requireTenantAdmin / requireSuperAdmin for stricter access.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== Role.SUPER_ADMIN && req.user.role !== Role.TENANT_ADMIN)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Require super admin role middleware
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};
