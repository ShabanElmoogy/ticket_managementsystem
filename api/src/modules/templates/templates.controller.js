import { db } from '../../config/database.js';
import { ticketTemplates } from './templates.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, or, isNull } from 'drizzle-orm';
import { getTenantScope } from '../../utils/tenantUtils.js';
import { isTenantScopedRole } from '../../middleware/auth.js';

const tenantFilter = (req) => {
  const scope = getTenantScope(req);
  return scope.type === 'TENANT' ? scope.tenantId : null;
};

// GET /templates
export const listTemplates = async (req, res) => {
  try {
    const tenantId = tenantFilter(req);
    const rows = await db
      .select({
        id: ticketTemplates.id,
        name: ticketTemplates.name,
        description: ticketTemplates.description,
        priority: ticketTemplates.priority,
        estimatedHours: ticketTemplates.estimatedHours,
        tenantId: ticketTemplates.tenantId,
        createdAt: ticketTemplates.createdAt,
        createdBy: { id: users.id, name: users.name },
      })
      .from(ticketTemplates)
      .innerJoin(users, eq(ticketTemplates.createdById, users.id))
      .where(tenantId
        ? or(eq(ticketTemplates.tenantId, tenantId), isNull(ticketTemplates.tenantId))
        : isNull(ticketTemplates.tenantId)
      )
      .orderBy(ticketTemplates.name);
    res.json(rows);
  } catch (e) {
    console.error('List templates error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /templates
export const createTemplate = async (req, res) => {
  try {
    const tenantId = tenantFilter(req);
    const { name, description, priority = 'MEDIUM', estimatedHours } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    const [row] = await db.insert(ticketTemplates).values({
      tenantId,
      name: name.trim(),
      description: description?.trim() || null,
      priority,
      estimatedHours: estimatedHours ?? null,
      createdById: req.user.userId,
    }).returning();
    res.status(201).json(row);
  } catch (e) {
    console.error('Create template error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /templates/:id
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = tenantFilter(req);
    const { name, description, priority, estimatedHours } = req.body;

    const condition = tenantId
      ? and(eq(ticketTemplates.id, id), eq(ticketTemplates.tenantId, tenantId))
      : eq(ticketTemplates.id, id);

    const updateData = { updatedAt: new Date() };
    if (name !== undefined)           updateData.name = name.trim();
    if (description !== undefined)    updateData.description = description?.trim() || null;
    if (priority !== undefined)       updateData.priority = priority;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours ?? null;

    const [updated] = await db.update(ticketTemplates).set(updateData).where(condition).returning();
    if (!updated) return res.status(404).json({ error: 'Template not found' });
    res.json(updated);
  } catch (e) {
    console.error('Update template error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /templates/:id
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = tenantFilter(req);
    const condition = tenantId
      ? and(eq(ticketTemplates.id, id), eq(ticketTemplates.tenantId, tenantId))
      : eq(ticketTemplates.id, id);

    const [deleted] = await db.delete(ticketTemplates).where(condition).returning({ id: ticketTemplates.id });
    if (!deleted) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (e) {
    console.error('Delete template error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
