import { extractBearerToken, verifyAccessToken } from '../utils/tokenService.js';

/**
 * Authenticate token middleware
 * Extracts and verifies JWT from Authorization header
 */
export const authenticateToken = (req, res, next) => {
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
        hasUserId: !!payload.userId,
      });
    }
    
    req.user = payload;
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
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};