/**
 * attachments.service.js
 * Business logic for the attachments module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import fs from 'fs';
import path from 'path';
import { isTenantScopedRole } from '../../middleware/auth.js';
import { logActivity, logActivityAndNotify } from '../../utils/activityUtils.js';
import { UPLOADS_DIR } from './attachments.upload.js';
import * as repo from './attachments.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAttachment(a) {
  return { ...a, url: `/uploads/${a.path ?? a.filename}` };
}

async function assertTicketAccess(ticketId, user, tenantId) {
  if (!isTenantScopedRole(user?.role)) return; // super-admin — no tenant check needed
  if (!tenantId) throw fail('Tenant context required', 403);
  const ticket = await repo.findTicketInTenant(ticketId, tenantId);
  if (!ticket) throw fail('Ticket not found', 404);
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function uploadAttachments(ticketId, files, user, tenantId) {
  if (!files || files.length === 0) throw fail('No files uploaded');

  await assertTicketAccess(ticketId, user, tenantId);

  const rows = files.map((f) => ({
    ticketId,
    uploadedById: user.userId,
    filename:     f.filename,
    originalName: f.originalname,
    mimeType:     f.mimetype,
    size:         f.size,
    path:         f.filename,
  }));

  const inserted = await repo.insertAttachments(rows);

  // Fire-and-forget activity log + notify
  logActivityAndNotify({
    ticketId,
    actorId:     user.userId,
    action:      'UPDATED',
    description: `Attached ${files.length} file(s): ${files.map((f) => f.originalname).join(', ')}`,
    tenantId:    tenantId ?? null,
  }).catch((e) => console.error('Activity log error:', e));

  return inserted.map(formatAttachment);
}

export async function getAttachments(ticketId, user, tenantId) {
  await assertTicketAccess(ticketId, user, tenantId);
  const rows = await repo.findAttachmentsByTicket(ticketId);
  return rows.map(formatAttachment);
}

export async function deleteAttachment(ticketId, attachmentId, user) {
  const attachment = await repo.findAttachmentById(attachmentId, ticketId);
  if (!attachment) throw fail('Attachment not found', 404);

  // Only the uploader or an admin can delete
  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'TENANT_ADMIN';
  if (!isAdmin && attachment.uploadedById !== user.userId) {
    throw fail('Access denied', 403);
  }

  // Delete file from disk — non-fatal if already gone
  const filePath = path.join(UPLOADS_DIR, attachment.path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await repo.deleteAttachmentById(attachmentId);

  // Fire-and-forget activity log + notify
  logActivityAndNotify({
    ticketId,
    actorId:     user.userId,
    action:      'UPDATED',
    description: `Deleted attachment: ${attachment.originalName}`,
  }).catch((e) => console.error('Activity log error:', e));

  return { message: 'Attachment deleted' };
}
