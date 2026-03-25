import { extractBearerToken, verifyAccessToken } from '../utils/tokenService.js';
import { Role, ADMIN_ROLES, TENANT_SCOPED_ROLES } from '../constants/roles.js';

/**
 * Authenticate token middleware
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
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
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

/**
 * Require programmer or admin role middleware
 */
export const requireProgrammerOrAdmin = (req, res, next) => {
  if (!req.user || !([...ADMIN_ROLES, Role.PROGRAMMER].includes(req.user.role))) {
    return res.status(403).json({ error: 'Programmer or admin access required' });
  }
  next();
};

/**
 * Helper: is the role tenant-scoped?
 */
export const isTenantScopedRole = (role) => TENANT_SCOPED_ROLES.includes(role);
