/**
 * pagination.js
 * Tenant-aware pagination utilities.
 *
 * Two modes:
 *   SERVER — API paginates. Client sends page + limit. Returns { data, pagination }.
 *   CLIENT — API returns full dataset (capped at maxClientRecords). Client paginates locally.
 *
 * Tenant settings (from tenants table):
 *   paginationMode     'SERVER' | 'CLIENT'
 *   defaultPageSize    default limit when none provided
 *   maxPageSize        hard cap on limit (SERVER mode)
 *   allowUserOverride  if false, always use defaultPageSize
 *   maxClientRecords   hard cap on CLIENT mode response size
 *
 * Fallback defaults (used when no tenant context):
 *   mode = SERVER, pageSize = 20, maxPageSize = 100, maxClientRecords = 500
 */

import { sql } from 'drizzle-orm';

// ── System-level fallback constants ──────────────────────────────────────────

export const DEFAULT_PAGE_SIZE    = 20;
export const MAX_PAGE_SIZE        = 100;
export const MAX_CLIENT_RECORDS   = 500;

// ── Tenant settings shape ─────────────────────────────────────────────────────

/**
 * Extract pagination settings from a tenant row.
 * Returns safe defaults if tenant is null (unauthenticated / super-admin).
 */
export function getTenantPaginationSettings(tenant) {
  if (!tenant) {
    return {
      mode:             'SERVER',
      defaultPageSize:  DEFAULT_PAGE_SIZE,
      maxPageSize:      MAX_PAGE_SIZE,
      allowUserOverride: true,
      maxClientRecords: MAX_CLIENT_RECORDS,
    };
  }
  return {
    mode:             tenant.paginationMode    ?? 'SERVER',
    defaultPageSize:  tenant.defaultPageSize   ?? DEFAULT_PAGE_SIZE,
    maxPageSize:      tenant.maxPageSize       ?? MAX_PAGE_SIZE,
    allowUserOverride: tenant.allowUserOverride ?? true,
    maxClientRecords: tenant.maxClientRecords  ?? MAX_CLIENT_RECORDS,
  };
}

// ── Core resolver ─────────────────────────────────────────────────────────────

/**
 * Resolve pagination parameters respecting tenant rules.
 *
 * Returns one of two shapes:
 *
 *   SERVER mode:
 *     { mode: 'SERVER', page, limit, offset }
 *
 *   CLIENT mode:
 *     { mode: 'CLIENT', limit }   ← limit = maxClientRecords, no page/offset
 *
 * @param {Object} query   - Express req.query
 * @param {Object} tenant  - Tenant row from DB (or null)
 */
export function resolvePaginationParams(query, tenant = null) {
  const settings = getTenantPaginationSettings(tenant);

  // ── CLIENT mode ───────────────────────────────────────────────────────────
  if (settings.mode === 'CLIENT') {
    return {
      mode:  'CLIENT',
      limit: settings.maxClientRecords,
    };
  }

  // ── SERVER mode ───────────────────────────────────────────────────────────
  const page = parseInt(query.page || '1', 10);
  if (!Number.isInteger(page) || page < 1) {
    throw Object.assign(new Error('Page must be a positive integer'), { status: 400 });
  }

  // Resolve limit
  let limit;
  if (!query.limit || !settings.allowUserOverride) {
    // Use tenant default — user override not allowed or not provided
    limit = settings.defaultPageSize;
  } else {
    limit = parseInt(query.limit, 10);
    if (!Number.isInteger(limit) || limit < 1) {
      throw Object.assign(new Error('Limit must be a positive integer'), { status: 400 });
    }
    // Enforce tenant max
    limit = Math.min(limit, settings.maxPageSize);
  }

  const offset = (page - 1) * limit;
  return { mode: 'SERVER', page, limit, offset };
}

/**
 * Legacy helper — resolves without tenant context.
 * Used by super-admin endpoints and any code that hasn't been migrated yet.
 */
export function parsePaginationParams(query) {
  return resolvePaginationParams(query, null);
}

// ── Response builders ─────────────────────────────────────────────────────────

/**
 * Build paginated response (SERVER mode).
 */
export function buildPaginatedResponse(data, total, page, limit) {
  const totalPages  = Math.ceil(total / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage:   hasNextPage ? page + 1 : null,
      prevPage:   hasPrevPage ? page - 1 : null,
      startIndex: (page - 1) * limit + 1,
      endIndex:   Math.min(page * limit, total),
    },
  };
}

/**
 * Build client-mode response — full dataset with a mode marker.
 * The client uses this to know it should paginate locally.
 */
export function buildClientResponse(data) {
  return {
    data,
    pagination: {
      mode:  'CLIENT',
      total: data.length,
    },
  };
}

// ── Service-layer helper ──────────────────────────────────────────────────────

/**
 * Execute a list query respecting tenant pagination settings.
 *
 * Usage in a service:
 *
 *   export async function listCustomers(tenantId, query, tenant) {
 *     const search = parseSearchParam(query);
 *     return executeTenantPaginatedQuery(
 *       tenant, query,
 *       (opts) => repo.findAllCustomers(tenantId, opts),
 *       (opts) => repo.countAllCustomers(tenantId, opts),
 *       { search },
 *     );
 *   }
 *
 * @param {Object}   tenant      - Tenant row (or null)
 * @param {Object}   query       - req.query
 * @param {Function} findFn      - (opts) => Promise<rows[]>
 * @param {Function} countFn     - (opts) => Promise<number>
 * @param {Object}   extraOpts   - Extra options passed to findFn/countFn (e.g. { search })
 */
export async function executeTenantPaginatedQuery(tenant, query, findFn, countFn, extraOpts = {}) {
  const params = resolvePaginationParams(query, tenant);

  if (params.mode === 'CLIENT') {
    // Return full dataset up to maxClientRecords
    const data = await findFn({ limit: params.limit, offset: 0, ...extraOpts });
    return buildClientResponse(data);
  }

  // SERVER mode — check if pagination was explicitly requested
  const hasPagination = 'page' in query || 'limit' in query;
  if (!hasPagination) {
    // Legacy: return plain array (backward compat)
    return findFn({ ...extraOpts });
  }

  const [data, total] = await Promise.all([
    findFn({ limit: params.limit, offset: params.offset, ...extraOpts }),
    countFn({ ...extraOpts }),
  ]);

  return buildPaginatedResponse(data, total, params.page, params.limit);
}

// ── Search ────────────────────────────────────────────────────────────────────

export function parseSearchParam(query) {
  const search = query.search || query.q;
  if (!search || typeof search !== 'string') return null;
  const cleaned = search.trim();
  if (cleaned.length === 0) return null;
  if (cleaned.length > 100) {
    throw Object.assign(new Error('Search term too long (max 100 characters)'), { status: 400 });
  }
  return cleaned;
}

export function addSearchToQuery(query, searchTerm, searchColumns) {
  if (!searchTerm || !searchColumns.length) return query;
  const conditions = searchColumns.map((col) => sql`${col} ILIKE ${`%${searchTerm}%`}`);
  const combined   = conditions.reduce((acc, c, i) => (i === 0 ? c : sql`${acc} OR ${c}`));
  return query.where(combined);
}

// ── Sorting ───────────────────────────────────────────────────────────────────

export function parseSortParams(query, allowedFields = []) {
  const sort  = query.sort || (allowedFields.includes('createdAt') ? 'createdAt' : allowedFields[0]);
  const order = query.order === 'asc' ? 'asc' : 'desc';
  if (allowedFields.length > 0 && !allowedFields.includes(sort)) {
    throw Object.assign(
      new Error(`Invalid sort field. Allowed: ${allowedFields.join(', ')}`),
      { status: 400 },
    );
  }
  return { sort, order };
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export function buildPaginatedResponseLegacy(data, total, page, limit) {
  return buildPaginatedResponse(data, total, page, limit);
}

export async function executePaginatedQuery(db, baseQuery, countQuery, limit, offset, page) {
  const [dataRows, countRows] = await Promise.all([
    baseQuery.limit(limit).offset(offset),
    countQuery,
  ]);
  const total = Number(countRows[0]?.count ?? 0);
  return buildPaginatedResponse(dataRows, total, page, limit);
}
