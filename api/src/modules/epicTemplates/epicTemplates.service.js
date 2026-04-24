/**
 * epicTemplates.service.js
 * Business logic for the epicTemplates module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './epicTemplates.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function listTemplates(tenantId) {
  return repo.findAllTemplates(tenantId ?? null);
}

export async function getTemplate(id) {
  const template = await repo.findTemplateById(id);
  if (!template) throw fail('Template not found', 404);
  return template;
}

export async function createTemplate(tenantId, body, createdById) {
  const { name, description, category, features } = body;
  if (!name?.trim()) throw fail('name is required');

  return repo.insertTemplate({
    name:        name.trim(),
    description: description?.trim() || null,
    category:    category?.trim() || 'General',
    features:    Array.isArray(features) ? features : [],
    tenantId:    tenantId ?? null,
    createdById: createdById ?? null,
  });
}

export async function updateTemplate(id, body) {
  const existing = await repo.findTemplateById(id);
  if (!existing) throw fail('Template not found', 404);

  const patch = {};
  if (body.name        !== undefined) patch.name        = body.name.trim();
  if (body.description !== undefined) patch.description = body.description?.trim() || null;
  if (body.category    !== undefined) patch.category    = body.category?.trim() || 'General';
  if (body.features    !== undefined) patch.features    = Array.isArray(body.features) ? body.features : [];

  return repo.updateTemplateById(id, patch);
}

export async function deleteTemplate(id) {
  const existing = await repo.findTemplateById(id);
  if (!existing) throw fail('Template not found', 404);
  await repo.deleteTemplateById(id);
  return { message: 'Template deleted' };
}

/**
 * Apply a template to an existing epic.
 * Bulk-creates feature requests + their steps from the template's features array.
 */
export async function applyTemplate(epicId, templateId, submittedById) {
  if (!templateId) throw fail('templateId is required');

  const [epic, template] = await Promise.all([
    repo.findEpicById(epicId),
    repo.findTemplateById(templateId),
  ]);

  if (!epic)     throw fail('Epic not found', 404);
  if (!template) throw fail('Template not found', 404);

  const templateFeatures = Array.isArray(template.features) ? template.features : [];
  let orderBase = await repo.getMaxEpicOrder(epicId);

  const created = [];
  for (const feat of templateFeatures) {
    const newFeature = await repo.insertFeature({
      title:        feat.title,
      description:  feat.description || '',
      status:       'PLANNED',
      tenantId:     epic.tenantId,
      submittedById,
      epicId,
      epicOrder:    orderBase++,
    });

    const steps = Array.isArray(feat.steps) ? feat.steps : [];
    if (steps.length) {
      await repo.insertSteps(
        steps.map((s, i) => ({
          featureRequestId: newFeature.id,
          title:            s.title,
          description:      s.description || null,
          order:            i,
          status:           'TODO',
        })),
      );
    }

    created.push(newFeature);
  }

  return { created: created.length, features: created };
}
