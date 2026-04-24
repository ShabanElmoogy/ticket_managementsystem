/**
 * attachments.repository.js
 * All database queries for the attachments module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { ticketAttachments } from './attachments.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and } from 'drizzle-orm';

// ── Shared column selection ───────────────────────────────────────────────────

const ATTACHMENT_COLUMNS = {
  id:           ticketAttachments.id,
  ticketId:     ticketAttachments.ticketId,
  uploadedById: ticketAttachments.uploadedById,
  filename:     ticketAttachments.filename,
  originalName: ticketAttachments.originalName,
  mimeType:     ticketAttachments.mimeType,
  size:         ticketAttachments.size,
  path:         ticketAttachments.path,
  createdAt:    ticketAttachments.createdAt,
};

// ── Ticket ownership check ────────────────────────────────────────────────────

/**
 * Verify a ticket exists and belongs to the given tenant.
 * Returns the ticket row or null.
 */
export async function findTicketInTenant(ticketId, tenantId) {
  const rows = await db
    .select({ id: tickets.id })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(and(eq(tickets.id, ticketId), eq(users.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** List all attachments for a ticket, with uploader info. */
export async function findAttachmentsByTicket(ticketId) {
  return db
    .select({
      ...ATTACHMENT_COLUMNS,
      uploadedBy: { id: users.id, name: users.name, email: users.email },
    })
    .from(ticketAttachments)
    .innerJoin(users, eq(ticketAttachments.uploadedById, users.id))
    .where(eq(ticketAttachments.ticketId, ticketId))
    .orderBy(ticketAttachments.createdAt);
}

/** Find a single attachment by ID and ticket ID. */
export async function findAttachmentById(attachmentId, ticketId) {
  const rows = await db
    .select(ATTACHMENT_COLUMNS)
    .from(ticketAttachments)
    .where(and(eq(ticketAttachments.id, attachmentId), eq(ticketAttachments.ticketId, ticketId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert multiple attachment rows, returns the created rows. */
export async function insertAttachments(rows) {
  return db.insert(ticketAttachments).values(rows).returning(ATTACHMENT_COLUMNS);
}

/** Delete an attachment by ID. */
export async function deleteAttachmentById(attachmentId) {
  await db.delete(ticketAttachments).where(eq(ticketAttachments.id, attachmentId));
}
