import { extractBearerToken, verifyAccessToken } from '../utils/tokenService.js';
import { Role, ADMIN_ROLES, TENANT_SCOPED_ROLES } from '../constants/roles.js';

// ── Pre-computed role sets ────────────────────────────────────────────────────
// Defined once at module level — not recreated on every request.

const PROGRAMMER_OR_ADMIN_ROLES = Object.freeze([...ADMIN_ROLES, Role.PROGRAMMER]);

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Authenticate token middleware.
 * Sets req.user from the verified JWT payload.
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
    // Expired / invalid tokens are normal client behaviour — warn, not error.
    const message = error.message.includes('expired') ? 'Token expired' : 'Invalid token';
    console.warn('Token verification:', message);
    return res.status(401).json({ error: message });
  }
};

/**
 * Require TENANT_ADMIN role.
 */
export const requireTenantAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== Role.TENANT_ADMIN) {
    return res.status(403).json({ error: 'Tenant admin access required' });
  }
  next();
};

/**
 * Require SUPER_ADMIN or TENANT_ADMIN role.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Require SUPER_ADMIN role.
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

/**
 * Require PROGRAMMER, SUPER_ADMIN, or TENANT_ADMIN role.
 */
export const requireProgrammerOrAdmin = (req, res, next) => {
  if (!req.user || !PROGRAMMER_OR_ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Programmer or admin access required' });
  }
  next();
};

/**
 * Helper: returns true if the role is always scoped to a single tenant.
 */
export const isTenantScopedRole = (role) => TENANT_SCOPED_ROLES.includes(role);
