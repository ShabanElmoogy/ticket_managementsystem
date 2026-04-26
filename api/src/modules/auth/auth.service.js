/**
 * auth.service.js
 * Business logic for the auth module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../../utils/tokenService.js';
import { Role, TENANT_SCOPED_ROLES } from '../../constants/roles.js';
import * as repo from './auth.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Token helpers ─────────────────────────────────────────────────────────────

/** Build the token payload — includes tenantId only for tenant-scoped roles. */
function buildTokenPayload(user) {
  return {
    userId: user.id,
    email:  user.email,
    role:   user.role,
    ...(TENANT_SCOPED_ROLES.includes(user.role) ? { tenantId: user.tenantId } : {}),
  };
}

/** Generate an access + refresh token pair and persist the refresh token. */
async function issueTokens(user) {
  const payload      = buildTokenPayload(user);
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await repo.insertRefreshToken(refreshToken, user.id);
  return { accessToken, refreshToken };
}

// ── Tenant status helper ──────────────────────────────────────────────────────

function resolveTenantStatus(tenant) {
  if (!tenant) return { tenantSuspended: false, tenantStatus: null };
  const isExpired    = tenant.subscriptionEnd && new Date(tenant.subscriptionEnd) < new Date();
  const tenantStatus = isExpired ? 'EXPIRED' : tenant.subscriptionStatus;
  const tenantSuspended = ['SUSPENDED', 'PAST_DUE', 'EXPIRED'].includes(tenantStatus);
  return { tenantSuspended, tenantStatus };
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function register(body, tenantSlug) {
  const { email, name, password, role = Role.EMPLOYEE } = body;

  let tenantId = null;
  let tenant   = null;

  if (role !== Role.SUPER_ADMIN) {
    if (!tenantSlug) {
      throw fail('Tenant context required. Provide X-Tenant-Slug header to register tenant users.');
    }
    tenant = await repo.findTenantBySlug(tenantSlug);
    if (!tenant) throw fail('Invalid tenant. X-Tenant-Slug does not match any tenant.');
    tenantId = tenant.id;
  }

  const existing = await repo.findExistingUser(email, role, tenantId);
  if (existing) throw fail('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await repo.insertUser({
    email,
    name,
    password: hashedPassword,
    role,
    ...(role === Role.SUPER_ADMIN ? {} : { tenantId }),
  });

  const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user,
    token:        accessToken,
    refreshToken,
    ...(tenant ? { tenant: { id: tenantId, slug: tenant.slug } } : {}),
  };
}

export async function login(email, password, tenantSlug) {
  // ── 1. Super-admin path (global, no tenant required) ──────────────────────
  const adminCandidate = await repo.findUserByEmailAndRole(email, Role.SUPER_ADMIN);

  if (adminCandidate) {
    const valid = await bcrypt.compare(password, adminCandidate.password);
    if (!valid) throw fail('Invalid credentials', 401);

    const { accessToken, refreshToken } = await issueTokens(adminCandidate);
    const { password: _, ...userWithoutPassword } = adminCandidate;

    return { user: userWithoutPassword, token: accessToken, refreshToken };
  }

  // ── 2. Tenant-scoped path ─────────────────────────────────────────────────
  if (!tenantSlug) {
    throw fail('Tenant context required. Provide X-Tenant-Slug header for tenant users.');
  }

  const tenant = await repo.findTenantBySlug(tenantSlug);
  if (!tenant) throw fail('Invalid tenant. X-Tenant-Slug does not match any tenant.');

  const user = await repo.findUserByEmailInTenant(email, tenant.id);
  if (!user) throw fail('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw fail('Invalid credentials', 401);

  const { accessToken, refreshToken } = await issueTokens(user);
  const { tenantSuspended, tenantStatus } = resolveTenantStatus(tenant);
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: { ...userWithoutPassword, tenantId: tenant.id, tenantSlug: tenant.slug },
    token:        accessToken,
    refreshToken,
    tenantSuspended,
    tenantStatus,
    tenant: {
      id:         tenant.id,
      slug:       tenant.slug,
      dateFormat: tenant.dateFormat ?? 'dd/MM/yyyy',
    },
  };
}

export async function refreshAccessToken(rawRefreshToken) {
  if (!rawRefreshToken) throw fail('Refresh token required', 401);

  const stored = await repo.findRefreshToken(rawRefreshToken);
  if (!stored)            throw fail('Refresh token not found', 401);
  if (stored.revokedAt)   throw fail('Refresh token has been revoked', 401);
  if (new Date() > stored.expiresAt) throw fail('Refresh token has expired', 401);

  const user = await repo.findUserById(stored.userId);
  if (!user) throw fail('User not found', 401);

  // Generate new token pair first, then rotate atomically in a transaction.
  // Generating outside the transaction is safe — if the transaction fails,
  // the new tokens are simply discarded (never persisted or returned).
  const payload         = buildTokenPayload(user);
  const accessToken     = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  await repo.rotateRefreshToken(rawRefreshToken, newRefreshToken, user.id);

  return { token: accessToken, refreshToken: newRefreshToken, user };
}

export async function logout(rawRefreshToken) {
  if (rawRefreshToken) {
    await repo.revokeRefreshToken(rawRefreshToken);
  }
  return { message: 'Logged out successfully' };
}

/** Dev-only: login without password check. */
export async function devLogin(email, tenantSlug) {
  let user, tenant;

  if (tenantSlug) {
    tenant = await repo.findTenantBySlug(tenantSlug);
    if (!tenant) throw fail('Invalid tenant', 400);
    user = await repo.findUserByEmailInTenant(email, tenant.id);
  } else {
    user = await repo.findUserByEmail(email);
  }

  if (!user) throw fail('User not found', 404);

  const { accessToken, refreshToken } = await issueTokens(user);
  const { tenantSuspended, tenantStatus } = resolveTenantStatus(tenant ?? null);
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: { ...userWithoutPassword, ...(tenant ? { tenantSlug: tenant.slug } : {}) },
    token:        accessToken,
    refreshToken,
    tenantSuspended,
    tenantStatus,
    ...(tenant ? { tenant: { id: tenant.id, slug: tenant.slug } } : {}),
  };
}
