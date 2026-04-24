/**
 * labels.repository.js
 * All database queries for the labels module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { labels, ticketLabels } from './labels.schema.js';
import { eq, asc, and, count } from 'drizzle-orm';

// ── Label queries ─────────────────────────────────────────────────────────────

/** List all labels with ticket count, ordered by name. */
export async function findAllLabels() {
  return db
    .select({
      id:          labels.id,
      name:        labels.name,
      color:       labels.color,
      description: labels.description,
      createdAt:   labels.createdAt,
      updatedAt:   labels.updatedAt,
      _count:      { tickets: count(ticketLabels.ticketId) },
    })
    .from(labels)
    .leftJoin(ticketLabels, eq(labels.id, ticketLabels.labelId))
    .groupBy(labels.id)
    .orderBy(asc(labels.name));
}

/** Find a label by ID. */
export async function findLabelById(id) {
  const rows = await db
    .select({ id: labels.id })
    .from(labels)
    .where(eq(labels.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert a new label, returns the created row. */
export async function insertLabel(values) {
  const [row] = await db.insert(labels).values(values).returning();
  return row;
}

/** Update a label by ID, returns the updated row. */
export async function updateLabelById(id, data) {
  const [row] = await db
    .update(labels)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(labels.id, id))
    .returning();
  return row ?? null;
}

/** Delete all ticket-label assignments for a label, then delete the label. */
export async function deleteLabelById(id) {
  await db.delete(ticketLabels).where(eq(ticketLabels.labelId, id));
  await db.delete(labels).where(eq(labels.id, id));
}

// ── Ticket-label assignment queries ──────────────────────────────────────────

/** Insert a ticket-label assignment, returns the created row. */
export async function insertTicketLabel(ticketId, labelId) {
  const [row] = await db
    .insert(ticketLabels)
    .values({ ticketId, labelId })
    .returning();
  return row;
}

/** Fetch a ticket-label assignment with the full label object. */
export async function findTicketLabelWithLabel(ticketLabelId) {
  const rows = await db
    .select({
      id:          ticketLabels.id,
      ticketId:    ticketLabels.ticketId,
      labelId:     ticketLabels.labelId,
      label: {
        id:          labels.id,
        name:        labels.name,
        color:       labels.color,
        description: labels.description,
      },
    })
    .from(ticketLabels)
    .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
    .where(eq(ticketLabels.id, ticketLabelId));
  return rows[0] ?? null;
}

/** Remove a label from a ticket. */
export async function deleteTicketLabel(ticketId, labelId) {
  await db
    .delete(ticketLabels)
    .where(and(eq(ticketLabels.ticketId, ticketId), eq(ticketLabels.labelId, labelId)));
}
