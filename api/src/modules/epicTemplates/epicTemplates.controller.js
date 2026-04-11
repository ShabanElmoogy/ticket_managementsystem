import { db } from '../../config/database.js';
import { epicTemplates } from './epicTemplates.schema.js';
import { featureRequests, featureSteps } from '../features/features.schema.js';
import { epics } from '../epics/epics/epics.schema.js';
import { eq, or, isNull, and } from 'drizzle-orm';
import { getTenantScope } from '../../utils/tenantUtils.js';

// List templates visible to the caller (global + tenant-own)
export const listTemplates = async (req, res) => {
  try {
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const rows = tenantId
      ? await db.select().from(epicTemplates)
          .where(or(isNull(epicTemplates.tenantId), eq(epicTemplates.tenantId, tenantId)))
      : await db.select().from(epicTemplates);

    res.json(rows);
  } catch (err) {
    console.error('listTemplates error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const [row] = await db.select().from(epicTemplates).where(eq(epicTemplates.id, req.params.id)).limit(1);
    if (!row) return res.status(404).json({ error: 'Template not found' });
    res.json(row);
  } catch (err) {
    console.error('getTemplate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const { name, description, category, features } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const createdById = req.user?.userId ?? req.user?.id ?? null;

    const [row] = await db.insert(epicTemplates).values({
      name: name.trim(),
      description: description?.trim() || null,
      category: category?.trim() || 'General',
      features: Array.isArray(features) ? features : [],
      tenantId,
      createdById,
    }).returning();

    res.status(201).json(row);
  } catch (err) {
    console.error('createTemplate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, features } = req.body;

    const [existing] = await db.select().from(epicTemplates).where(eq(epicTemplates.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    const patch = { updatedAt: new Date() };
    if (name !== undefined) patch.name = name.trim();
    if (description !== undefined) patch.description = description?.trim() || null;
    if (category !== undefined) patch.category = category?.trim() || 'General';
    if (features !== undefined) patch.features = Array.isArray(features) ? features : [];

    const [updated] = await db.update(epicTemplates).set(patch).where(eq(epicTemplates.id, id)).returning();
    res.json(updated);
  } catch (err) {
    console.error('updateTemplate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const [existing] = await db.select({ id: epicTemplates.id }).from(epicTemplates).where(eq(epicTemplates.id, req.params.id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    await db.delete(epicTemplates).where(eq(epicTemplates.id, req.params.id));
    res.json({ message: 'Template deleted' });
  } catch (err) {
    console.error('deleteTemplate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply a template to an existing epic — bulk-creates features + steps
export const applyTemplate = async (req, res) => {
  try {
    const { epicId } = req.params;
    const { templateId } = req.body;
    if (!templateId) return res.status(400).json({ error: 'templateId is required' });

    const [epic] = await db.select({ id: epics.id, tenantId: epics.tenantId })
      .from(epics).where(eq(epics.id, epicId)).limit(1);
    if (!epic) return res.status(404).json({ error: 'Epic not found' });

    const [template] = await db.select().from(epicTemplates).where(eq(epicTemplates.id, templateId)).limit(1);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const submittedById = req.user?.userId ?? req.user?.id;
    const templateFeatures = Array.isArray(template.features) ? template.features : [];

    // Get current max epicOrder
    const existing = await db.select({ epicOrder: featureRequests.epicOrder })
      .from(featureRequests).where(eq(featureRequests.epicId, epicId));
    let orderBase = existing.length ? Math.max(...existing.map((f) => f.epicOrder ?? 0)) + 1 : 0;

    const created = [];
    for (const feat of templateFeatures) {
      const [newFeature] = await db.insert(featureRequests).values({
        title: feat.title,
        description: feat.description || '',
        status: 'PLANNED',
        tenantId: epic.tenantId,
        submittedById,
        epicId,
        epicOrder: orderBase++,
      }).returning();

      const steps = Array.isArray(feat.steps) ? feat.steps : [];
      if (steps.length) {
        await db.insert(featureSteps).values(
          steps.map((s, i) => ({
            featureRequestId: newFeature.id,
            title: s.title,
            description: s.description || null,
            order: i,
            status: 'TODO',
          }))
        );
      }
      created.push(newFeature);
    }

    res.status(201).json({ created: created.length, features: created });
  } catch (err) {
    console.error('applyTemplate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
