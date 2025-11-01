import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenService.js';
import { users, refreshTokens } from '../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Helper: Store refresh token in database
 */
const storeRefreshToken = async (token, userId) => {
  try {
    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(refreshTokens).values({
      token,
      userId,
      expiresAt
    });
  } catch (error) {
    console.error('Error storing refresh token:', error);
    throw error;
  }
};

/**
 * Helper: Revoke refresh token
 */
const revokeRefreshToken = async (token) => {
  try {
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.token, token));
  } catch (error) {
    console.error('Error revoking refresh token:', error);
    throw error;
  }
};

/**
 * Helper: Validate refresh token in database
 */
const validateRefreshTokenInDb = async (token) => {
  try {
    const [storedToken] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token)).limit(1);

    if (!storedToken) {
      throw new Error('Refresh token not found in database');
    }

    if (storedToken.revokedAt) {
      throw new Error('Refresh token has been revoked');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new Error('Refresh token has expired');
    }

    return storedToken;
  } catch (error) {
    console.error('Error validating refresh token:', error);
    throw error;
  }
};

// Register new user
export const register = async (req, res) => {
  try {
    const { email, name, password, role = 'EMPLOYEE' } = req.body;

    // Validate input
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [user] = await db.insert(users).values({
      email,
      name,
      password: hashedPassword,
      role
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshTokenValue = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Store refresh token in database
    await storeRefreshToken(refreshTokenValue, user.id);

    res.status(201).json({
      user,
      token: accessToken,
      refreshToken: refreshTokenValue
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshTokenValue = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Store refresh token in database
    await storeRefreshToken(refreshTokenValue, user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token: accessToken,
      refreshToken: refreshTokenValue
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: refreshTokenFromBody } = req.body;

    if (!refreshTokenFromBody) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Validate refresh token in database (no JWT verification needed)
    let storedToken;
    try {
      storedToken = await validateRefreshTokenInDb(refreshTokenFromBody);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }

    // Find user
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role
    }).from(users).where(eq(users.id, storedToken.userId)).limit(1);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token (JWT)
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Generate new refresh token (simple random string)
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Revoke old refresh token
    await revokeRefreshToken(refreshTokenFromBody);

    // Store new refresh token
    await storeRefreshToken(newRefreshToken, user.id);

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke refresh token
      await revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};