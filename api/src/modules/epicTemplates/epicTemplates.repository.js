/**
 * epicTemplates.repository.js
 * All database queries for the epicTemplates module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { epicTemplates } from './epicTemplates.schema.js';
import { featureRequests, featureSteps } from '../features/features.schema.js';
import { epics } from '../epics/epics/epics.schema.js';
import { eq, or, isNull, and, inArray } from 'drizzle-orm';

// ── Templates ─────────────────────────────────────────────────────────────────

/**
 * List templates visible to the caller.
 * Tenant users see global templates (tenantId IS NULL) + their own.
 * Super-admin sees all.
 */
export async function findAllTemplates(tenantId) {
  return tenantId
    ? db.select().from(epicTemplates)
        .where(or(isNull(epicTemplates.tenantId), eq(epicTemplates.tenantId, tenantId)))
    : db.select().from(epicTemplates);
}

/** Find a single template by ID. */
export async function findTemplateById(id) {
  const rows = await db.select().from(epicTemplates)
    .where(eq(epicTemplates.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Insert a new template, returns the created row. */
export async function insertTemplate(values) {
  const [row] = await db.insert(epicTemplates).values(values).returning();
  return row;
}

/** Update a template by ID, returns the updated row. */
export async function updateTemplateById(id, data) {
  const [row] = await db.update(epicTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(epicTemplates.id, id))
    .returning();
  return row ?? null;
}

/** Delete a template by ID. */
export async function deleteTemplateById(id) {
  await db.delete(epicTemplates).where(eq(epicTemplates.id, id));
}

// ── Apply template helpers ────────────────────────────────────────────────────

/** Find an epic by ID (minimal — id + tenantId). */
export async function findEpicById(epicId) {
  const rows = await db
    .select({ id: epics.id, tenantId: epics.tenantId })
    .from(epics).where(eq(epics.id, epicId)).limit(1);
  return rows[0] ?? null;
}

/** Get current max epicOrder for features linked to an epic. */
export async function getMaxEpicOrder(epicId) {
  const rows = await db
    .select({ epicOrder: featureRequests.epicOrder })
    .from(featureRequests)
    .where(eq(featureRequests.epicId, epicId));
  return rows.length ? Math.max(...rows.map((f) => f.epicOrder ?? 0)) + 1 : 0;
}

/** Insert a feature request, returns the created row. */
export async function insertFeature(values) {
  const [row] = await db.insert(featureRequests).values(values).returning();
  return row;
}

/** Bulk-insert feature steps for a feature. */
export async function insertSteps(steps) {
  if (!steps.length) return;
  await db.insert(featureSteps).values(steps);
}
