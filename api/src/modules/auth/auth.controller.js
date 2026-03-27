import bcrypt from 'bcryptjs';
import { db } from '../../config/database.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/tokenService.js';
import { users } from '../users/users.schema.js';
import { refreshTokens } from './auth.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { eq, and } from 'drizzle-orm';
import { Role, TENANT_SCOPED_ROLES } from '../../constants/roles.js';

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
    const { email, name, password, role = Role.EMPLOYEE } = req.body;

    // Validate input
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // Tenant-scoped registration:
    // - SUPER_ADMIN can be created without tenant.
    // - TENANT_ADMIN / EMPLOYEE must be created within a tenant context.
    const tenantSlugRaw = req.headers['x-tenant-slug'];
    const tenantSlug = typeof tenantSlugRaw === 'string' ? tenantSlugRaw.trim() : '';

    let tenantId = null;
    let tenant = null;

    if (role !== Role.SUPER_ADMIN) {
      if (!tenantSlug) {
        return res.status(400).json({
          error: 'Tenant context required',
          details: 'Provide X-Tenant-Slug header to register tenant users.'
        });
      }

      [tenant] = await db
        .select({ id: tenants.id, slug: tenants.slug })
        .from(tenants)
        .where(eq(tenants.slug, tenantSlug))
        .limit(1);

      if (!tenant) {
        return res.status(400).json({
          error: 'Invalid tenant',
          details: 'X-Tenant-Slug does not match any tenant.'
        });
      }

      tenantId = tenant.id;
    }

    // Check if user already exists
    // - SUPER_ADMIN: global uniqueness by email
    // - Tenant users: uniqueness by (email, tenantId)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(role === Role.SUPER_ADMIN ? eq(users.email, email) : and(eq(users.email, email), eq(users.tenantId, tenantId)))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        password: hashedPassword,
        role,
        ...(role === Role.SUPER_ADMIN ? {} : { tenantId })
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        tenantId: users.tenantId,
        createdAt: users.createdAt
      });

    // Generate tokens
    // Best practice: include tenantId in token for tenant-scoped roles.
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      ...(TENANT_SCOPED_ROLES.includes(user.role) ? { tenantId: user.tenantId } : {})
    });

    const refreshTokenValue = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      ...(TENANT_SCOPED_ROLES.includes(user.role) ? { tenantId: user.tenantId } : {})
    });

    // Store refresh token in database
    await storeRefreshToken(refreshTokenValue, user.id);

    res.status(201).json({
      user,
      token: accessToken,
      refreshToken: refreshTokenValue,
      ...(tenant ? { tenant: { id: tenantId, slug: tenant.slug } } : {})
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

    // Debug (non-production): helps diagnose why login fails (tenant header, user lookup, password match)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Login attempt:', {
        email,
        hasPassword: !!password,
        tenantSlugHeader: req.headers['x-tenant-slug'] || null,
      });
    }

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Multi-tenant best practice:
    // - SUPER_ADMIN login is global and must NOT require tenant.
    // - TENANT_ADMIN / EMPLOYEE login is tenant-scoped and requires a valid tenant.

    // 1) Try global super admin login first (no tenant check)
    const [adminCandidate] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.role, Role.SUPER_ADMIN)))
      .limit(1);

    // If admin exists and password matches, login as admin immediately.
    if (adminCandidate) {
      const validAdminPassword = await bcrypt.compare(password, adminCandidate.password);

      if (process.env.NODE_ENV !== 'production') {
        console.log('🔎 SUPER_ADMIN candidate found:', {
          id: adminCandidate.id,
          email: adminCandidate.email,
          role: adminCandidate.role,
          tenantId: adminCandidate.tenantId ?? null,
          passwordMatch: validAdminPassword,
        });
      }

      if (validAdminPassword) {
        const accessToken = generateAccessToken({
          userId: adminCandidate.id,
          email: adminCandidate.email,
          role: adminCandidate.role,
        });

        const refreshTokenValue = generateRefreshToken({
          userId: adminCandidate.id,
          email: adminCandidate.email,
          role: adminCandidate.role,
        });

        await storeRefreshToken(refreshTokenValue, adminCandidate.id);

        const { password: __, ...adminWithoutPassword } = adminCandidate;
        return res.json({
          user: adminWithoutPassword,
          token: accessToken,
          refreshToken: refreshTokenValue,
        });
      }

      // If password doesn't match, do NOT continue to tenant-scoped flow.
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2) Tenant-scoped login flow (TENANT_ADMIN / EMPLOYEE)
    // Best practice: require explicit tenant context and return 400 for missing/invalid tenant input.
    // Use 401 only for actual credential mismatch.
    const tenantSlugRaw = req.headers['x-tenant-slug'];
    const tenantSlug = typeof tenantSlugRaw === 'string' ? tenantSlugRaw.trim() : '';

    if (!tenantSlug) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ Tenant-scoped login rejected: missing X-Tenant-Slug');
      }
      return res.status(400).json({
        error: 'Tenant context required',
        details: 'Provide X-Tenant-Slug header for tenant users.'
      });
    }

    const [tenant] = await db
      .select({ id: tenants.id, slug: tenants.slug, subscriptionStatus: tenants.subscriptionStatus, subscriptionEnd: tenants.subscriptionEnd })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return res.status(400).json({
        error: 'Invalid tenant',
        details: 'X-Tenant-Slug does not match any tenant.'
      });
    }

    // Flag restricted tenants but allow login (read-only mode)
    const isExpired = tenant.subscriptionEnd && new Date(tenant.subscriptionEnd) < new Date();
    const tenantStatus = isExpired ? 'EXPIRED' : tenant.subscriptionStatus; // ACTIVE | TRIAL | PAST_DUE | SUSPENDED | EXPIRED
    const tenantSuspended = tenantStatus === 'SUSPENDED' || tenantStatus === 'PAST_DUE' || tenantStatus === 'EXPIRED';

    const tenantId = tenant.id;

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
      .limit(1);

    // Do not reveal whether email exists; keep response generic.
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ Tenant-scoped login rejected: user not found for tenant', { email, tenantId });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ Tenant-scoped login rejected: password mismatch', { email, tenantId, role: user.role });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    // Best practice: include tenantId in token for tenant-scoped roles.
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      ...(TENANT_SCOPED_ROLES.includes(user.role) ? { tenantId } : {}),
    });

    const refreshTokenValue = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      ...(TENANT_SCOPED_ROLES.includes(user.role) ? { tenantId } : {}),
    });

    // Store refresh token in database
    await storeRefreshToken(refreshTokenValue, user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: {
        ...userWithoutPassword,
        tenantId,
        tenantSlug: tenant.slug,
      },
      token: accessToken,
      refreshToken: refreshTokenValue,
      tenantSuspended,
      tenantStatus,
      tenant: {
        id: tenantId,
        slug: tenant.slug,
      },
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
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        tenantId: users.tenantId,
      })
      .from(users)
      .where(eq(users.id, storedToken.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token (JWT)
    // Best practice: include tenantId in token for tenant-scoped roles.
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      ...(TENANT_SCOPED_ROLES.includes(user.role) ? { tenantId: user.tenantId } : {}),
    });

    // Generate new refresh token
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      ...(TENANT_SCOPED_ROLES.includes(user.role) ? { tenantId: user.tenantId } : {}),
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
