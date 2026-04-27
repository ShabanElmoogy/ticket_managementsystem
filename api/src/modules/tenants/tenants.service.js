/**
 * tenants.service.js
 * Business logic for the tenants module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './tenants.repository.js';
import { parsePaginationParams, buildPaginatedResponse, parseSearchParam } from '../../utils/pagination.js';
import { invalidateTenantCache } from '../../middleware/index.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Slug helper ───────────────────────────────────────────────────────────────

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── Date helper ───────────────────────────────────────────────────────────────

function parseOptionalDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d;
}

// ── Operations ────────────────────────────────────────────────────────────────

/**
 * List tenants with optional pagination and search.
 * Maintains backward compatibility while adding comprehensive validation.
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Array|Object>} Array of tenants or paginated response
 */
export async function listTenants(query = {}) {
  // Parse and validate search parameter
  const search = parseSearchParam(query);
  
  // Determine if pagination is requested
  const hasPagination = 'page' in query || 'limit' in query;
  
  if (!hasPagination) {
    // Legacy behavior - return all tenants as array
    return repo.findAllTenants({ search });
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
    repo.findAllTenants({ limit, offset, search }),
    repo.countAllTenants({ search }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
}

export async function listTenantsPublic() {
  const rows = await repo.findAllTenantsPublic();
  if (!rows.length) return [];

  const ids = rows.map((t) => t.id);
  const reps = await repo.getBatchTenantRepresentatives(ids);

  return rows.map((t) => ({ ...t, ...reps[t.id] }));
}

export async function getTenantBySlug(slug) {
  const tenant = await repo.findTenantBySlug(slug);
  if (!tenant) throw fail('Tenant not found', 404);
  return tenant;
}

export async function getTenantStats(id) {
  const tenant = await repo.findTenantById(id);
  if (!tenant) throw fail('Tenant not found', 404);
  return repo.getTenantCounts(id);
}

export async function createTenant(body) {
  const {
    name, slug, subscriptionPlan, subscriptionStatus,
    subscriptionStart, subscriptionEnd, subscriptionSeats, supportEmail,
  } = body;

  if (!name) throw fail('name is required');

  const finalSlug = toSlug(slug || name);
  if (!finalSlug) throw fail('slug is required');

  // Slug uniqueness check
  const existing = await repo.findTenantBySlugMeta(finalSlug);
  if (existing) throw fail(`Slug "${finalSlug}" is already taken`);

  return repo.insertTenant({
    name,
    slug: finalSlug,
    subscriptionPlan:   subscriptionPlan   || undefined,
    subscriptionStatus: subscriptionStatus || undefined,
    subscriptionStart:  subscriptionStart  ? new Date(subscriptionStart) : undefined,
    subscriptionEnd:    subscriptionEnd    ? new Date(subscriptionEnd)   : undefined,
    subscriptionSeats:  typeof subscriptionSeats === 'number' ? subscriptionSeats : undefined,
    supportEmail:       supportEmail || null,
  });
}

export async function updateTenant(id, body) {
  const {
    name, slug, subscriptionPlan, subscriptionStatus,
    subscriptionStart, subscriptionEnd, subscriptionSeats, supportEmail,
  } = body;

  const patch = {};
  if (name               !== undefined) patch.name               = name;
  if (subscriptionPlan   !== undefined) patch.subscriptionPlan   = subscriptionPlan;
  if (subscriptionStatus !== undefined) patch.subscriptionStatus = subscriptionStatus;
  if (subscriptionSeats  !== undefined) patch.subscriptionSeats  = subscriptionSeats;
  if (subscriptionStart  !== undefined) patch.subscriptionStart  = parseOptionalDate(subscriptionStart);
  if (subscriptionEnd    !== undefined) patch.subscriptionEnd    = parseOptionalDate(subscriptionEnd);
  if (supportEmail       !== undefined) patch.supportEmail       = supportEmail || null;

  if (slug !== undefined) {
    const newSlug = toSlug(slug);
    if (!newSlug) throw fail('slug cannot be empty');
    // Check uniqueness only if slug is actually changing
    const current = await repo.findTenantById(id);
    if (!current) throw fail('Tenant not found', 404);
    if (newSlug !== current.slug) {
      const taken = await repo.findTenantBySlugMeta(newSlug);
      if (taken) throw fail(`Slug "${newSlug}" is already taken`);
    }
    patch.slug = newSlug;
  }

  const updated = await repo.updateTenantById(id, patch);
  if (!updated) throw fail('Tenant not found', 404);

  // Evict from LRU cache so the new data is served immediately
  invalidateTenantCache(updated.slug, updated.id);

  return updated;
}

export async function activateTenant(id) {
  const tenant = await repo.findTenantById(id);
  if (!tenant) throw fail('Tenant not found', 404);

  const updated = await repo.updateTenantById(id, { subscriptionStatus: 'ACTIVE' });
  invalidateTenantCache(updated.slug, updated.id);
  return updated;
}

export async function deactivateTenant(id) {
  const tenant = await repo.findTenantById(id);
  if (!tenant) throw fail('Tenant not found', 404);
  if (tenant.subscriptionStatus === 'SUSPENDED') {
    throw fail('Tenant is already deactivated');
  }

  const updated = await repo.suspendTenantById(id);
  invalidateTenantCache(updated.slug, updated.id);
  return updated;
}

export async function deleteTenant(id) {
  const tenant = await repo.findTenantById(id);
  if (!tenant) throw fail('Tenant not found', 404);

  // Soft-delete: suspend the tenant (cascade to users/tickets via FK)
  const updated = await repo.suspendTenantById(id);
  invalidateTenantCache(updated.slug, updated.id);
  return { message: 'Tenant deactivated successfully' };
}

// ── Pagination settings ───────────────────────────────────────────────────────

const PAGINATION_FIELDS = ['paginationMode', 'defaultPageSize', 'maxPageSize', 'allowUserOverride', 'maxClientRecords'];

export async function getPaginationSettings(tenantId) {
  const tenant = await repo.findTenantById(tenantId);
  if (!tenant) throw fail('Tenant not found', 404);
  return {
    paginationMode:    tenant.paginationMode,
    defaultPageSize:   tenant.defaultPageSize,
    maxPageSize:       tenant.maxPageSize,
    allowUserOverride: tenant.allowUserOverride,
    maxClientRecords:  tenant.maxClientRecords,
  };
}

export async function updatePaginationSettings(tenantId, body) {
  const { paginationMode, defaultPageSize, maxPageSize, allowUserOverride, maxClientRecords } = body;

  if (paginationMode !== undefined && !['SERVER', 'CLIENT'].includes(paginationMode)) {
    throw fail('paginationMode must be SERVER or CLIENT');
  }
  if (defaultPageSize !== undefined && (defaultPageSize < 5 || defaultPageSize > 200)) {
    throw fail('defaultPageSize must be between 5 and 200');
  }
  if (maxPageSize !== undefined && (maxPageSize < 5 || maxPageSize > 500)) {
    throw fail('maxPageSize must be between 5 and 500');
  }
  if (maxClientRecords !== undefined && (maxClientRecords < 50 || maxClientRecords > 5000)) {
    throw fail('maxClientRecords must be between 50 and 5000');
  }

  const patch = {};
  if (paginationMode    !== undefined) patch.paginationMode    = paginationMode;
  if (defaultPageSize   !== undefined) patch.defaultPageSize   = defaultPageSize;
  if (maxPageSize       !== undefined) patch.maxPageSize       = maxPageSize;
  if (allowUserOverride !== undefined) patch.allowUserOverride = allowUserOverride;
  if (maxClientRecords  !== undefined) patch.maxClientRecords  = maxClientRecords;

  const updated = await repo.updateTenantById(tenantId, patch);
  if (!updated) throw fail('Tenant not found', 404);

  invalidateTenantCache(updated.slug, updated.id);

  return {
    paginationMode:    updated.paginationMode,
    defaultPageSize:   updated.defaultPageSize,
    maxPageSize:       updated.maxPageSize,
    allowUserOverride: updated.allowUserOverride,
    maxClientRecords:  updated.maxClientRecords,
  };
}
