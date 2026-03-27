import { db } from '../../config/database.js';
import { ticketAttachments } from './attachments.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and } from 'drizzle-orm';
import { isTenantScopedRole } from '../../middleware/auth.js';
import { getTenantScope } from '../../utils/tenantUtils.js';
import { logActivity } from '../../utils/activityUtils.js';
import fs from 'fs';
import path from 'path';
import { UPLOADS_DIR } from './attachments.upload.js';

// POST /tickets/:id/attachments
export const uploadAttachments = async (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Tenant scope check
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    if (isTenantScopedRole(req.user?.role)) {
      if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });
      const [row] = await db
        .select({ id: tickets.id })
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(and(eq(tickets.id, ticketId), eq(users.tenantId, tenantId)))
        .limit(1);
      if (!row) return res.status(404).json({ error: 'Ticket not found' });
    }

    const rows = files.map((f) => ({
      ticketId,
      uploadedById: req.user.userId,
      filename: f.filename,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      path: f.filename,
    }));

    const inserted = await db.insert(ticketAttachments).values(rows).returning();

    await logActivity({
      ticketId,
      userId: req.user.userId,
      action: 'UPDATED',
      description: `Attached ${files.length} file(s): ${files.map((f) => f.originalname).join(', ')}`,
    });

    res.status(201).json(inserted.map(formatAttachment));
  } catch (error) {
    console.error('Upload attachments error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// GET /tickets/:id/attachments
export const getAttachments = async (req, res) => {
  try {
    const { id: ticketId } = req.params;

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    if (isTenantScopedRole(req.user?.role)) {
      if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });
      const [row] = await db
        .select({ id: tickets.id })
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(and(eq(tickets.id, ticketId), eq(users.tenantId, tenantId)))
        .limit(1);
      if (!row) return res.status(404).json({ error: 'Ticket not found' });
    }

    const rows = await db
      .select({
        id: ticketAttachments.id,
        ticketId: ticketAttachments.ticketId,
        filename: ticketAttachments.filename,
        originalName: ticketAttachments.originalName,
        mimeType: ticketAttachments.mimeType,
        size: ticketAttachments.size,
        path: ticketAttachments.path,
        createdAt: ticketAttachments.createdAt,
        uploadedBy: { id: users.id, name: users.name, email: users.email },
      })
      .from(ticketAttachments)
      .innerJoin(users, eq(ticketAttachments.uploadedById, users.id))
      .where(eq(ticketAttachments.ticketId, ticketId))
      .orderBy(ticketAttachments.createdAt);

    res.json(rows.map(formatAttachment));
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /tickets/:id/attachments/:attachmentId
export const deleteAttachment = async (req, res) => {
  try {
    const { id: ticketId, attachmentId } = req.params;

    const [attachment] = await db
      .select()
      .from(ticketAttachments)
      .where(and(eq(ticketAttachments.id, attachmentId), eq(ticketAttachments.ticketId, ticketId)))
      .limit(1);

    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    // Only uploader or admin can delete
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'TENANT_ADMIN';
    if (!isAdmin && attachment.uploadedById !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from disk
    const filePath = path.join(UPLOADS_DIR, attachment.path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.delete(ticketAttachments).where(eq(ticketAttachments.id, attachmentId));

    await logActivity({
      ticketId,
      userId: req.user.userId,
      action: 'UPDATED',
      description: `Deleted attachment: ${attachment.originalName}`,
    });

    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatAttachment(a) {
  return {
    ...a,
    url: `/uploads/${a.path ?? a.filename}`,
  };
}
