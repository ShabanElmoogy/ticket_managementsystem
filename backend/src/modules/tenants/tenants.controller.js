import { eq, and } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { tenants } from './tenants.schema.js';
import { users } from '../users/users.schema.js';
import { Role } from '../../constants/roles.js';

const toSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const parseOptionalDate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value);
  // If invalid date, let DB/driver throw by passing the original value
  return Number.isNaN(d.getTime()) ? value : d;
};

export const listTenantsPublic = async (req, res) => {
  const rows = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .orderBy(tenants.name);

  // Attach the first TENANT_ADMIN email for each tenant (dev convenience)
  const withAdmin = await Promise.all(
    rows.map(async (t) => {
      const [admin] = await db
        .select({ email: users.email })
        .from(users)
        .where(and(eq(users.tenantId, t.id), eq(users.role, Role.TENANT_ADMIN)))
        .limit(1);
      return { ...t, adminEmail: admin?.email ?? null };
    })
  );

  return res.json(withAdmin);
};

export const listTenants = async (req, res) => {
  const rows = await db.select().from(tenants).orderBy(tenants.createdAt);
  return res.json(rows);
};

export const createTenant = async (req, res) => {
  const {
    name,
    slug,
    subscriptionPlan,
    subscriptionStatus,
    subscriptionStart,
    subscriptionEnd,
    subscriptionSeats,
  } = req.body || {};

  if (!name) return res.status(400).json({ error: 'name is required' });

  const finalSlug = toSlug(slug || name);
  if (!finalSlug) return res.status(400).json({ error: 'slug is required' });

  const inserted = await db
    .insert(tenants)
    .values({
      name,
      slug: finalSlug,
      subscriptionPlan: subscriptionPlan || undefined,
      subscriptionStatus: subscriptionStatus || undefined,
      subscriptionStart: subscriptionStart ? new Date(subscriptionStart) : undefined,
      subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : undefined,
      subscriptionSeats: typeof subscriptionSeats === 'number' ? subscriptionSeats : undefined,
    })
    .returning();

  return res.status(201).json(inserted[0]);
};

export const updateTenant = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const {
    name,
    slug,
    subscriptionPlan,
    subscriptionStatus,
    subscriptionStart,
    subscriptionEnd,
    subscriptionSeats,
  } = req.body || {};

  const patch = {
    ...(name !== undefined ? { name } : {}),
    ...(slug !== undefined ? { slug: toSlug(slug) } : {}),
    ...(subscriptionPlan !== undefined ? { subscriptionPlan } : {}),
    ...(subscriptionStatus !== undefined ? { subscriptionStatus } : {}),
    ...(subscriptionSeats !== undefined ? { subscriptionSeats } : {}),
    ...(subscriptionStart !== undefined ? { subscriptionStart: parseOptionalDate(subscriptionStart) } : {}),
    ...(subscriptionEnd !== undefined ? { subscriptionEnd: parseOptionalDate(subscriptionEnd) } : {}),
    updatedAt: new Date(),
  };

  const updated = await db
    .update(tenants)
    .set(patch)
    .where(eq(tenants.id, id))
    .returning();

  if (!updated.length) return res.status(404).json({ error: 'Tenant not found' });
  return res.json(updated[0]);
};

export const getTenantBySlug = async (req, res) => {
  const { slug } = req.params;
  const rows = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (!rows.length) return res.status(404).json({ error: 'Tenant not found' });
  return res.json(rows[0]);
};
