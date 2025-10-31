import jwt from 'jsonwebtoken';

/**
 * Token Service - Centralized JWT token management
 * Follows best practices:
 * - Single source of truth for token configuration
 * - Consistent signing and verification
 * - Clear error handling
 * - Separation of concerns
 */

// Configuration
const TOKEN_CONFIG = {
  algorithm: 'HS256',
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
};

// Secrets
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_REFRESH_SECRET || process.env.JWT_SECRET;

// Validate secrets on module load
if (!ACCESS_TOKEN_SECRET) {
  throw new Error('FATAL: JWT_SECRET or ACCESS_TOKEN_SECRET must be set in environment variables');
}

/**
 * Generate access token
 * @param {Object} payload - Token payload (userId, email, role, etc.)
 * @returns {string} Signed JWT token
 */
export const generateAccessToken = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a non-empty object');
  }

  try {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      algorithm: TOKEN_CONFIG.algorithm,
      expiresIn: TOKEN_CONFIG.accessTokenExpiry,
      issuer: 'ticket-management-system',
      subject: String(payload.userId),
    });
  } catch (error) {
    throw new Error(`Failed to generate access token: ${error.message}`);
  }
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload (userId, email, role, etc.)
 * @returns {string} Signed JWT token
 */
export const generateRefreshToken = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a non-empty object');
  }

  try {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      algorithm: TOKEN_CONFIG.algorithm,
      expiresIn: TOKEN_CONFIG.refreshTokenExpiry,
      issuer: 'ticket-management-system',
      subject: String(payload.userId),
    });
  } catch (error) {
    throw new Error(`Failed to generate refresh token: ${error.message}`);
  }
};

/**
 * Generate both access and refresh tokens
 * @param {Object} payload - Token payload
 * @returns {Object} { accessToken, refreshToken }
 */
export const generateTokenPair = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }

  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET, {
      algorithms: [TOKEN_CONFIG.algorithm],
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token signature');
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }

  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET, {
      algorithms: [TOKEN_CONFIG.algorithm],
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token signature');
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Extract Bearer token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
export const extractBearerToken = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Decode token without verification (for debugging/inspection only)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
export const decodeToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    return jwt.decode(token, { complete: false });
  } catch (error) {
    return null;
  }
};

/**
 * Get token configuration
 * @returns {Object} Current token configuration
 */
export const getTokenConfig = () => ({
  ...TOKEN_CONFIG,
  hasRefreshSecret: !!REFRESH_TOKEN_SECRET,
});

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractBearerToken,
  decodeToken,
  getTokenConfig,
};
