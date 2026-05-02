/**
 * users.service.js
 * Business logic for the users module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import bcrypt from 'bcryptjs';
import { Role } from '../../constants/roles.js';
import { parsePaginationParams, buildPaginatedResponse, parseSearchParam } from '../../utils/pagination.js';
import {
  findAllUsers,
  countAllUsers,
  findUserById,
  findTenantUserById,
  findUserByEmail,
  findUserByEmailInTenant,
  findUsersByTenant,
  countUsersByTenant,
  countUsersInTenant,
  findTenantSeats,
  insertUser,
  updateUserById,
  updateTenantUserById,
  updateUserPassword,
  deleteUserById,
  deleteTenantUserById,
  forceDeleteUser,
  getUserCounts,
  getBatchUserCounts,
  getUserStats,
  findEmployees,
  findProgrammers,
  findTenantStatus,
} from './users.repository.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

function attachCounts(user, counts) {
  return { ...user, _count: counts };
}

// ── Super-admin operations ────────────────────────────────────────────────────

/**
 * List all users with optional pagination and search.
 * Maintains backward compatibility while adding comprehensive validation.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Array|Object>} Array of users or paginated response
 */
export async function listAllUsers(query = {}) {
  // Parse and validate search parameter
  const search = parseSearchParam(query);
  
  // Determine if pagination is requested
  const hasPagination = 'page' in query || 'limit' in query;
  
  if (!hasPagination) {
    // Legacy behavior - return all users as array
    const usersData = await findAllUsers({ search });
    const ids = usersData.map((u) => u.id);
    const counts = await getBatchUserCounts(ids);
    return usersData.map((u) => attachCounts(u, counts[u.id]));
  }

  // Paginated response with validation
  const { page, limit, offset } = parsePaginationParams(query);
  
  // Additional validation for pagination parameters
  if (page < 1) {
    throw fail('Page must be >= 1', 400);
  }
  if (limit < 1 || limit > 100) {
    throw fail('Limit must be between 1 and 100', 400);
  }

  // Execute count and data queries in parallel for optimal performance
  const [usersData, total] = await Promise.all([
    findAllUsers({ limit, offset, search }),
    countAllUsers({ search }),
  ]);

  if (!usersData.length) {
    return buildPaginatedResponse([], total, page, limit);
  }

  // Enrich with counts
  const ids = usersData.map((u) => u.id);
  const counts = await getBatchUserCounts(ids);
  const enrichedData = usersData.map((u) => attachCounts(u, counts[u.id]));

  return buildPaginatedResponse(enrichedData, total, page, limit);
}

export async function getUserById(id) {
  const user = await findUserById(id);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const counts = await getUserCounts(id);
  return attachCounts(user, counts);
}

export async function createUser(tenantId, { email, name, password, phone, whatsappNotifications = false }) {
  if (!email || !name || !password) {
    throw Object.assign(new Error('Email, name, and password are required'), { status: 400 });
  }

  const duplicate = await findUserByEmailInTenant(email, tenantId);
  if (duplicate) throw Object.assign(new Error('User with this email already exists'), { status: 400 });

  const hashedPassword = await hashPassword(password);
  return insertUser({
    tenantId,
    email,
    name,
    password: hashedPassword,
    role: Role.TENANT_ADMIN,
    phone,
    whatsappNotifications,
  });
}

export async function updateUser(id, { email, name, role, password, phone, whatsappNotifications, reminderEnabled, reminderInterval }) {
  const existing = await findUserById(id);
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });

  if (email && email !== existing.email) {
    const taken = await findUserByEmail(email);
    if (taken) throw Object.assign(new Error('Email already in use'), { status: 400 });
  }

  const data = {};
  if (email)                              data.email                  = email;
  if (name)                               data.name                   = name;
  if (role)                               data.role                   = role;
  if (phone !== undefined)                data.phone                  = phone;
  if (whatsappNotifications !== undefined) data.whatsappNotifications = whatsappNotifications;
  if (reminderEnabled !== undefined)      data.reminderEnabled        = reminderEnabled;
  if (reminderInterval !== undefined)     data.reminderInterval       = reminderInterval;
  if (password)                           data.password               = await hashPassword(password);

  const updated = await updateUserById(id, data);
  const counts  = await getUserCounts(id);
  return attachCounts(updated, counts);
}

export async function deleteUser(id, force = false) {
  const existing = await findUserById(id);
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });

  const counts = await getUserCounts(id);
  const hasRelated = counts.assignedTickets > 0 || counts.createdTickets > 0 || counts.comments > 0;

  if (!force && hasRelated) {
    throw Object.assign(
      new Error('Cannot delete user with associated tickets or comments. Please reassign or remove associated data first.'),
      { status: 400, errorCode: 'ASSOCIATED_DATA' },
    );
  }

  if (force) {
    await forceDeleteUser(id);
    return { message: 'User and related data deleted successfully' };
  }

  await deleteUserById(id);
  return { message: 'User deleted successfully' };
}

export async function resetUserPassword(id, password) {
  if (!password || password.length < 6) {
    throw Object.assign(new Error('Password must be at least 6 characters'), { status: 400 });
  }
  const existing = await findUserById(id);
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });

  await updateUserPassword(id, await hashPassword(password));
  return { message: 'Password reset successfully' };
}

// ── Tenant-admin operations ───────────────────────────────────────────────────

/**
 * List tenant users with optional pagination and search.
 * @param {string} tenantId - Tenant ID for scoping
 * @param {Object} query - Query parameters from request
 * @returns {Array|Object} Array of users or paginated response
 */
export async function listTenantUsers(tenantId, query = {}) {
  // Input validation
  if (!tenantId || typeof tenantId !== 'string') {
    throw fail('Invalid tenant ID', 400);
  }

  // Parse and validate search parameter
  const search = parseSearchParam(query);
  
  // Determine if pagination is requested
  const hasPagination = 'page' in query || 'limit' in query;
  
  if (!hasPagination) {
    // Legacy behavior - return all users as array
    return findUsersByTenant(tenantId, { search });
  }

  // Paginated response with validation
  const { page, limit, offset } = parsePaginationParams(query);
  
  // Additional validation for pagination parameters
  if (page < 1) {
    throw fail('Page must be >= 1', 400);
  }
  if (limit < 1 || limit > 100) {
    throw fail('Limit must be between 1 and 100', 400);
  }

  // Execute count and data queries in parallel for optimal performance
  const [data, total] = await Promise.all([
    findUsersByTenant(tenantId, { limit, offset, search }),
    countUsersByTenant(tenantId, { search }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
}

export async function createTenantUser(tenantId, { email, name, password, role = Role.EMPLOYEE, phone, whatsappNotifications = false }) {
  if (!email || !name || !password) {
    throw Object.assign(new Error('Email, name, and password are required'), { status: 400 });
  }
  if (role === Role.SUPER_ADMIN) {
    throw Object.assign(new Error('Not allowed to create SUPER_ADMIN'), { status: 403 });
  }

  // Enforce seat limit
  const seats = await findTenantSeats(tenantId);
  if (seats > 0) {
    const used = await countUsersInTenant(tenantId);
    if (used >= seats) {
      throw Object.assign(
        new Error(`Seat limit reached. Your plan allows ${seats} user(s). Please upgrade your subscription to add more users.`),
        { status: 403 },
      );
    }
  }

  const duplicate = await findUserByEmailInTenant(email, tenantId);
  if (duplicate) throw Object.assign(new Error('User with this email already exists'), { status: 400 });

  const hashedPassword = await hashPassword(password);
  return insertUser({ tenantId, email, name, password: hashedPassword, role, phone, whatsappNotifications });
}

export async function updateTenantUser(id, tenantId, { email, name, role, password, phone, whatsappNotifications, reminderEnabled, reminderInterval }) {
  const existing = await findTenantUserById(id, tenantId);
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });

  if (role === Role.SUPER_ADMIN) {
    throw Object.assign(new Error('Cannot assign SUPER_ADMIN role'), { status: 403 });
  }

  if (email && email !== existing.email) {
    const taken = await findUserByEmailInTenant(email, tenantId);
    if (taken) throw Object.assign(new Error('Email already in use'), { status: 400 });
  }

  const data = {};
  if (email)                              data.email                  = email;
  if (name)                               data.name                   = name;
  if (role)                               data.role                   = role;
  if (phone !== undefined)                data.phone                  = phone;
  if (whatsappNotifications !== undefined) data.whatsappNotifications = whatsappNotifications;
  if (reminderEnabled !== undefined)      data.reminderEnabled        = reminderEnabled;
  if (reminderInterval !== undefined)     data.reminderInterval       = reminderInterval;
  if (password)                           data.password               = await hashPassword(password);

  const updated = await updateTenantUserById(id, tenantId, data);
  const counts  = await getUserCounts(id);
  return attachCounts(updated, counts);
}

export async function deleteTenantUser(id, tenantId, force = false) {
  const existing = await findTenantUserById(id, tenantId);
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });

  const counts = await getUserCounts(id);
  const hasRelated = counts.assignedTickets > 0 || counts.createdTickets > 0 || counts.comments > 0;

  if (!force && hasRelated) {
    throw Object.assign(
      new Error('Cannot delete user with associated tickets or comments. Please reassign or remove associated data first.'),
      { status: 400, errorCode: 'ASSOCIATED_DATA' },
    );
  }

  if (force && hasRelated) {
    // Tenant-scoped force delete — cascade within the tenant's data only
    await forceDeleteUser(id);
    return { message: 'User and related data deleted successfully' };
  }

  await deleteTenantUserById(id, tenantId);
  return { message: 'User deleted successfully' };
}

export async function resetTenantUserPassword(id, tenantId, password) {
  if (!password || password.length < 6) {
    throw Object.assign(new Error('Password must be at least 6 characters'), { status: 400 });
  }
  const existing = await findTenantUserById(id, tenantId);
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });
  if (existing.tenantId !== tenantId) throw Object.assign(new Error('Forbidden'), { status: 403 });

  await updateUserPassword(id, await hashPassword(password));
  return { message: 'Password reset successfully' };
}

export async function getTenantSeats(tenantId) {
  const [seats, used] = await Promise.all([
    findTenantSeats(tenantId),
    countUsersInTenant(tenantId),
  ]);
  return { used, total: seats };
}

// ── Shared / profile operations ───────────────────────────────────────────────

export async function getCurrentProfile(userId) {
  const user = await findUserById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}

export async function updateOwnProfile(userId, { name, email, phone, reminderEnabled, reminderInterval }) {
  const existing = await findUserById(userId);
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });

  if (email && email !== existing.email) {
    const taken = await findUserByEmail(email);
    if (taken) throw Object.assign(new Error('Email already in use'), { status: 400 });
  }

  const data = {};
  if (name !== undefined)             data.name             = name;
  if (email !== undefined)            data.email            = email;
  if (phone !== undefined)            data.phone            = phone;
  if (reminderEnabled !== undefined)  data.reminderEnabled  = reminderEnabled;
  if (reminderInterval !== undefined) data.reminderInterval = reminderInterval;

  return updateUserById(userId, data);
}

export async function getTenantStatus(userId) {
  return findTenantStatus(userId);
}

export async function getStats() {
  return getUserStats();
}

export async function getEmployees(tenantId) {
  return findEmployees(tenantId ?? null);
}

export async function getProgrammers(tenantId) {
  return findProgrammers(tenantId ?? null);
}
