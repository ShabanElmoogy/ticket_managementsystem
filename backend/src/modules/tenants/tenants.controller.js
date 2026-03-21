import { eq } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { tenants } from './tenants.schema.js';

const toSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const listTenants = async (req, res) => {
  const rows = await db.select().from(tenants).orderBy(tenants.createdAt);
  return res.json(rows);
};

export const createTenant = async (req, res) => {
  const { name, slug } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const finalSlug = toSlug(slug || name);
  if (!finalSlug) return res.status(400).json({ error: 'slug is required' });

  const inserted = await db
    .insert(tenants)
    .values({ name, slug: finalSlug })
    .returning();

  return res.status(201).json(inserted[0]);
};

export const getTenantBySlug = async (req, res) => {
  const { slug } = req.params;
  const rows = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (!rows.length) return res.status(404).json({ error: 'Tenant not found' });
  return res.json(rows[0]);
};
