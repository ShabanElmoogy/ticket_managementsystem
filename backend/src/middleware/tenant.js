import { eq } from 'drizzle-orm';
import { LRUCache } from 'lru-cache';
import { db } from '../config/database.js';
import { tenants } from '../modules/tenants/tenants.schema.js';
import { Role } from '../constants/roles.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Slugs: lowercase alphanumeric + hyphens, 1–63 chars (DNS label convention).
const SLUG_RE = /^[a-z0-9-]{1,63}$/;
const isValidUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

// Configurable via env so the cache can be tuned per deployment without
// a code change. Defaults: 500 entries, 60 s TTL, 10 s for negative entries.
const tenantCache = new LRUCache({
  max: parseInt(process.env.TENANT_CACHE_MAX  ?? '500',   10),
  ttl: parseInt(process.env.TENANT_CACHE_TTL_MS ?? '60000', 10),
});
const MISS_TTL = parseInt(process.env.TENANT_CACHE_MISS_TTL_MS ?? '10000', 10);

// Single-flight map: coalesces concurrent DB lookups for the same key so
// a cache stampede on TTL expiry fires exactly one query, not N.
const inFlight = new Map();

/**
 * Evict a tenant from the in-process cache.
 * Call this from the tenants controller after any update or delete so
 * suspended / renamed tenants are not served from stale cache entries.
 */
export const invalidateTenantCache = (slug, id) => {
  if (slug) tenantCache.delete(slug.toLowerCase().trim());
  if (id)   tenantCache.delete(`id:${id}`);
};

/** Isolated DB fetch — keeps resolveTenant readable and unit-testable. */
const fetchTenantFromDb = (tenantSlug, safeId) => {
  const projection = {
    id:                 tenants.id,
    slug:               tenants.slug,
    name:               tenants.name,
    subscriptionStatus: tenants.subscriptionStatus,
    subscriptionPlan:   tenants.subscriptionPlan,
    subscriptionSeats:  tenants.subscriptionSeats,
  };
  if (tenantSlug) {
    return db.select(projection).from(tenants)
      .where(eq(tenants.slug, tenantSlug)).limit(1)
      .then((r) => r[0] ?? null);
  }
  return db.select(projection).from(tenants)
    .where(eq(tenants.id, safeId)).limit(1)
    .then((r) => r[0] ?? null);
};

/**
 * Multi-tenant resolver middleware.
 *
 * MUST be composed after authenticateToken — enforced at runtime in
 * development (throws) and at composition time via authenticateAndResolveTenant.
 *
 * Resolution order:
 *  1) X-Tenant-Slug header  (normalized to lowercase)
 *  2) X-Tenant-Id header    (validated UUID; rejected if malformed)
 *  3) :tenantSlug route param
 *
 * Sets:
 *  - req.tenant   = { id, slug, name, subscriptionStatus, ... } | null
 *  - req.tenantId = string | null
 */
export const resolveTenant = async (req, res, next) => {
  try {
    // Enforce middleware order contract — loud failure in development.
    if (!req.user) {
      if (process.env.NODE_ENV === 'development') {
        throw new Error('[resolveTenant] Middleware order violation: must run after authenticateToken');
      }
      req.tenant = null;
      req.tenantId = null;
      return next();
    }

    const headerSlug = req.headers['x-tenant-slug'];
    const headerId   = req.headers['x-tenant-id'];
    const paramSlug  = req.params?.tenantSlug;

    // Reject ambiguous input — slug and id refer to the same dimension.
    if (headerSlug && headerId) {
      return res.status(400).json({ error: 'Provide either X-Tenant-Slug or X-Tenant-Id, not both' });
    }

    // Normalize slug: lowercase + trim eliminates case-variant cache splits
    // and prevents cache-invalidation bypass via casing tricks.
    const rawSlug    = headerSlug || paramSlug;
    const tenantSlug = rawSlug ? rawSlug.toLowerCase().trim() : null;
    const safeId     = isValidUuid(headerId) ? headerId : null;

    // Fast-reject slugs that can never exist before touching cache or DB.
    if (tenantSlug && !SLUG_RE.test(tenantSlug)) {
      return res.status(400).json({ error: 'Invalid tenant slug' });
    }

    const cacheKey = tenantSlug ? tenantSlug : safeId ? `id:${safeId}` : null;

    if (!cacheKey) {
      req.tenant = null;
      req.tenantId = null;
      return next();
    }

    // Cache hit — null entries are negative cache (tenant not found).
    if (tenantCache.has(cacheKey)) {
      const cached = tenantCache.get(cacheKey);
      if (!cached) {
        const isSuperAdmin = req.user.role === Role.SUPER_ADMIN;
        return res.status(isSuperAdmin ? 404 : 403).json({ error: 'Tenant not found' });
      }
      req.tenant   = cached;
      req.tenantId = cached.id;
      return next();
    }

    // Single-flight: if another request is already fetching this key,
    // await the same promise instead of firing a second DB query.
    if (!inFlight.has(cacheKey)) {
      inFlight.set(
        cacheKey,
        fetchTenantFromDb(tenantSlug, safeId).finally(() => inFlight.delete(cacheKey)),
      );
    }
    const row = await inFlight.get(cacheKey);

    if (!row) {
      // Cache the miss with a short TTL to absorb repeated lookups.
      tenantCache.set(cacheKey, null, { ttl: MISS_TTL });
      const isSuperAdmin = req.user.role === Role.SUPER_ADMIN;
      return res.status(isSuperAdmin ? 404 : 403).json({ error: 'Tenant not found' });
    }

    // Block suspended / cancelled tenants before any controller runs.
    if (row.subscriptionStatus === 'SUSPENDED' || row.subscriptionStatus === 'CANCELLED') {
      return res.status(403).json({ error: 'Tenant subscription is inactive' });
    }

    // Populate both keys so slug↔id lookups are both cache hits.
    tenantCache.set(row.slug, row);
    tenantCache.set(`id:${row.id}`, row);

    req.tenant   = row;
    req.tenantId = row.id;
    next();
  } catch (e) {
    next(e);
  }
};
