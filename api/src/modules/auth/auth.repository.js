/**
 * auth.repository.js
 * All database queries for the auth module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { users } from '../users/users.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { refreshTokens } from './auth.schema.js';
import { eq, and } from 'drizzle-orm';

// ── Shared column selection ───────────────────────────────────────────────────

/** User columns returned after login/register — never includes password. */
const USER_COLUMNS = {
  id:        users.id,
  email:     users.email,
  name:      users.name,
  role:      users.role,
  tenantId:  users.tenantId,
  createdAt: users.createdAt,
};

// ── User queries ──────────────────────────────────────────────────────────────

/** Find a user by email + role (used for super-admin login). */
export async function findUserByEmailAndRole(email, role) {
  const rows = await db
    .select()                          // include password for bcrypt comparison
    .from(users)
    .where(and(eq(users.email, email), eq(users.role, role)))
    .limit(1);
  return rows[0] ?? null;
}

/** Find a user by email scoped to a tenant (used for tenant login). */
export async function findUserByEmailInTenant(email, tenantId) {
  const rows = await db
    .select()                          // include password for bcrypt comparison
    .from(users)
    .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Find a user by email globally (used for dev-login without tenant). */
export async function findUserByEmail(email) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
}

/** Find a user by ID (safe columns — no password). */
export async function findUserById(id) {
  const rows = await db
    .select(USER_COLUMNS)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Check if a user already exists by email (global or tenant-scoped). */
export async function findExistingUser(email, role, tenantId) {
  const where = role === 'SUPER_ADMIN'
    ? eq(users.email, email)
    : and(eq(users.email, email), eq(users.tenantId, tenantId));

  const rows = await db.select({ id: users.id }).from(users).where(where).limit(1);
  return rows[0] ?? null;
}

/** Insert a new user, returns safe columns (no password). */
export async function insertUser(values) {
  const [user] = await db
    .insert(users)
    .values(values)
    .returning(USER_COLUMNS);
  return user;
}

// ── Tenant queries ────────────────────────────────────────────────────────────

/** Find a tenant by slug. */
export async function findTenantBySlug(slug) {
  const rows = await db
    .select({
      id:                 tenants.id,
      slug:               tenants.slug,
      subscriptionStatus: tenants.subscriptionStatus,
      subscriptionEnd:    tenants.subscriptionEnd,
      dateFormat:         tenants.dateFormat,
    })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

// ── Refresh token queries ─────────────────────────────────────────────────────

/** Store a new refresh token, expiry driven by REFRESH_TOKEN_EXPIRES_IN env var. */
export async function insertRefreshToken(token, userId) {
  const expiresAt = new Date();
  const raw       = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d';
  const match     = raw.match(/^(\d+)([smhd])$/);
  if (match) {
    const n = parseInt(match[1], 10);
    const unit = match[2];
    if      (unit === 's') expiresAt.setSeconds(expiresAt.getSeconds() + n);
    else if (unit === 'm') expiresAt.setMinutes(expiresAt.getMinutes() + n);
    else if (unit === 'h') expiresAt.setHours(expiresAt.getHours() + n);
    else if (unit === 'd') expiresAt.setDate(expiresAt.getDate() + n);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7); // safe fallback
  }
  await db.insert(refreshTokens).values({ token, userId, expiresAt });
}

/** Find a refresh token row by token string. */
export async function findRefreshToken(token) {
  const rows = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token))
    .limit(1);
  return rows[0] ?? null;
}

/** Revoke old token and insert new one atomically — prevents logout on server crash mid-rotation. */
export async function rotateRefreshToken(oldToken, newToken, userId) {
  await db.transaction(async (tx) => {
    await tx.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.token, oldToken));

    const expiresAt = new Date();
    const raw       = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d';
    const match     = raw.match(/^(\d+)([smhd])$/);
    if (match) {
      const n = parseInt(match[1], 10);
      const unit = match[2];
      if      (unit === 's') expiresAt.setSeconds(expiresAt.getSeconds() + n);
      else if (unit === 'm') expiresAt.setMinutes(expiresAt.getMinutes() + n);
      else if (unit === 'h') expiresAt.setHours(expiresAt.getHours() + n);
      else if (unit === 'd') expiresAt.setDate(expiresAt.getDate() + n);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await tx.insert(refreshTokens).values({ token: newToken, userId, expiresAt });
  });
}

/** Mark a single refresh token as revoked (used on logout). */
export async function revokeRefreshToken(token) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.token, token));
}
