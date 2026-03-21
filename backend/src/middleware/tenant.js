import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { tenants } from '../modules/tenants/tenants.schema.js';

/**
 * Multi-tenant resolver middleware.
 *
 * Resolution order:
 *  1) X-Tenant-Slug header
 *  2) X-Tenant-Id header
 *  3) :tenantSlug route param
 *
 * Sets:
 *  - req.tenant = { id, slug, name }
 *  - req.tenantId
 */
export const resolveTenant = async (req, res, next) => {
  try {
    const headerSlug = req.headers['x-tenant-slug'];
    const headerId = req.headers['x-tenant-id'];
    const paramSlug = req.params?.tenantSlug;

    const tenantSlug = headerSlug || paramSlug;

    let row;
    if (tenantSlug) {
      const rows = await db.select().from(tenants).where(eq(tenants.slug, String(tenantSlug))).limit(1);
      row = rows[0];
    } else if (headerId) {
      const rows = await db.select().from(tenants).where(eq(tenants.id, String(headerId))).limit(1);
      row = rows[0];
    }

    // If no tenant provided, allow request to continue.
    // This supports admin login / public endpoints that are not tenant-scoped.
    if (!row) {
      req.tenant = null;
      req.tenantId = null;
      return next();
    }

    req.tenant = row;
    req.tenantId = row.id;
    next();
  } catch (e) {
    console.error('resolveTenant error:', e);
    return res.status(500).json({ error: 'Failed to resolve tenant' });
  }
};
