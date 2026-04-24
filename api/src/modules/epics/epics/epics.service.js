/**
 * epics.service.js
 * Business logic for the epics module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './epics.repository.js';
import { logEpicActivity } from '../epicActivity/epicActivity.service.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Progress computation ──────────────────────────────────────────────────────

function computeProgress(epicId, features, steps) {
  const epicFeatures = features.filter((f) => f.epicId === epicId);
  const epicFeatureIds = epicFeatures.map((f) => f.id);
  const epicSteps = steps.filter((s) => epicFeatureIds.includes(s.featureRequestId));

  const featureStatusCounts = epicFeatures.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] ?? 0) + 1;
    return acc;
  }, {});

  const stepsTotal = epicSteps.length;
  const stepsDone  = epicSteps.filter((s) => s.status === 'DONE').length;

  const activeFeatures  = epicFeatures.filter((f) => f.status !== 'DECLINED');
  const shippedFeatures = epicFeatures.filter((f) => f.status === 'SHIPPED').length;

  const derivedTotal = stepsTotal || activeFeatures.length;
  const derivedDone  = stepsTotal ? stepsDone : shippedFeatures;

  return { featureCount: epicFeatures.length, stepsTotal: derivedTotal, stepsDone: derivedDone, featureStatusCounts };
}

// ── Hierarchy helpers ─────────────────────────────────────────────────────────

async function attachHierarchy(rows) {
  if (!rows.length) return rows.map((r) => ({ ...r, parentEpic: null, subEpics: [] }));

  const parentIds = [...new Set(rows.map((r) => r.parentEpicId).filter(Boolean))];
  const parentById = await repo.findParentEpicsByIds(parentIds);

  const ids = rows.map((r) => r.id);
  const children = await repo.findChildrenForEpics(ids);

  return rows.map((r) => ({
    ...r,
    parentEpic: r.parentEpicId ? (parentById[r.parentEpicId] ?? null) : null,
    subEpics:   children.filter((c) => c.parentEpicId === r.id),
  }));
}

async function attachProgress(rows) {
  if (!rows.length) return rows.map((r) => ({ ...r, featureCount: 0, stepsTotal: 0, stepsDone: 0, featureStatusCounts: {} }));
  const epicIds = rows.map((r) => r.id);
  const { features, steps } = await repo.findFeaturesAndStepsForEpics(epicIds);
  return rows.map((r) => ({ ...r, ...computeProgress(r.id, features, steps) }));
}

async function attachDependencies(rows) {
  if (!rows.length) return rows.map((r) => ({ ...r, blockedBy: [], blocking: [] }));
  const ids = rows.map((r) => r.id);

  const [deps, blocking] = await Promise.all([
    Promise.all(ids.map((id) => repo.findBlockers(id))).then((res) => res.flat()),
    Promise.all(ids.map((id) => repo.findBlocking(id))).then((res) => res.flat()),
  ]);

  const refIds = [...new Set([...deps.map((d) => d.blockerId), ...blocking.map((d) => d.epicId)])];
  const refEpics = await repo.findEpicsByIds(refIds);
  const byId = Object.fromEntries(refEpics.map((e) => [e.id, e]));

  return rows.map((r) => ({
    ...r,
    blockedBy: deps.filter((d) => d.epicId === r.id).map((d) => byId[d.blockerId]).filter(Boolean),
    blocking:  blocking.filter((d) => d.blockerId === r.id).map((d) => byId[d.epicId]).filter(Boolean),
  }));
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function listEpics(tenantId) {
  const rows = await repo.findAllEpics(tenantId ?? null);
  const withProgress = await attachProgress(rows);
  const withDeps     = await attachDependencies(withProgress);
  return attachHierarchy(withDeps);
}

export async function getEpic(id) {
  const row = await repo.findEpicById(id);
  if (!row) throw fail('Epic not found', 404);

  const [withProgress] = await attachProgress([row]);
  const [withDeps]     = await attachDependencies([withProgress]);
  const [withHierarchy] = await attachHierarchy([withDeps]);

  const [ancestors, subEpicRows, features] = await Promise.all([
    repo.buildAncestorChain(row.parentEpicId),
    repo.findSubEpics(id),
    repo.findEpicFeatures(id),
  ]);

  const subEpicsWithProgress = await attachProgress(subEpicRows);

  const featureIds = features.map((f) => f.id);
  const votes = await repo.findVotesForFeatures(featureIds);

  // Auto-assign epicOrder if all are 0 (first load)
  if (features.length > 1 && features.every((f) => f.epicOrder === 0)) {
    await Promise.all(features.map((f, i) => repo.updateFeatureOrder(f.id, i)));
    features.forEach((f, i) => { f.epicOrder = i; });
  }

  return {
    ...withHierarchy,
    ancestors,
    subEpics: subEpicsWithProgress,
    features: features.map((f) => ({
      ...f,
      voteCount: votes.filter((v) => v.featureRequestId === f.id).length,
    })),
  };
}

export async function createEpic(tenantId, body, actorId) {
  const { title, description, ownerId, applicationId, customerId, targetDate, priority, tags, estimatedDays, parentEpicId } = body;

  if (!title?.trim()) throw fail('title is required');

  if (parentEpicId) {
    const parent = await repo.findEpicMeta(parentEpicId);
    if (!parent) throw fail('Parent epic not found');
  }

  const row = await repo.insertEpic({
    title:         title.trim(),
    description:   description?.trim() || null,
    priority:      priority || 'MEDIUM',
    tags:          Array.isArray(tags) ? tags : [],
    tenantId:      tenantId ?? null,
    ownerId:       ownerId || null,
    applicationId: applicationId || null,
    customerId:    customerId || null,
    targetDate:    targetDate || null,
    estimatedDays: estimatedDays ? parseInt(estimatedDays, 10) : null,
    parentEpicId:  parentEpicId || null,
  });

  return { ...row, ownerName: null, applicationName: null, customerName: null, featureCount: 0, stepsTotal: 0, stepsDone: 0, featureStatusCounts: {}, parentEpic: null, subEpics: [], ancestors: [] };
}

export async function updateEpic(id, body, actorId) {
  const existing = await repo.findEpicMeta(id);
  if (!existing) throw fail('Epic not found', 404);

  const patch = {};

  if (body.title       !== undefined) patch.title       = body.title;
  if (body.description !== undefined) patch.description = body.description || null;
  if (body.ownerId     !== undefined) patch.ownerId     = body.ownerId || null;
  if (body.applicationId !== undefined) patch.applicationId = body.applicationId || null;
  if (body.customerId  !== undefined) patch.customerId  = body.customerId || null;
  if (body.priority    !== undefined) patch.priority    = body.priority;
  if (body.tags        !== undefined) patch.tags        = Array.isArray(body.tags) ? body.tags : [];
  if (body.targetDate  !== undefined) patch.targetDate  = body.targetDate || null;
  if (body.estimatedDays !== undefined) patch.estimatedDays = body.estimatedDays ? parseInt(body.estimatedDays, 10) : null;

  // Status change — check blockers before allowing COMPLETED
  if (body.status !== undefined) {
    if (body.status === 'COMPLETED') {
      const blockers = await repo.findBlockers(id);
      if (blockers.length) {
        const blockerEpics = await repo.findEpicsByIds(blockers.map((b) => b.blockerId));
        const unresolved = blockerEpics.filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED');
        if (unresolved.length) {
          throw fail(`Blocked by unresolved epic${unresolved.length > 1 ? 's' : ''}: ${unresolved.map((e) => e.title).join(', ')}`);
        }
      }
    }
    patch.status = body.status;
  }

  // Parent change — circular detection
  if (body.parentEpicId !== undefined) {
    const newParentId = body.parentEpicId || null;
    if (newParentId) {
      if (newParentId === id) throw fail('An epic cannot be its own parent');
      const ancestors = await repo.buildAncestorChain(newParentId);
      if (ancestors.some((a) => a.id === id)) throw fail('Circular parent relationship detected');
      const parent = await repo.findEpicMeta(newParentId);
      if (!parent) throw fail('Parent epic not found');
    }
    patch.parentEpicId = newParentId;
  }

  const updated = await repo.updateEpicById(id, patch);

  // Activity log
  if (patch.status)   await logEpicActivity(id, actorId, 'STATUS_CHANGED',   { from: existing.status ?? null, to: patch.status });
  if (patch.title)    await logEpicActivity(id, actorId, 'TITLE_CHANGED',    { to: patch.title });
  if (patch.priority) await logEpicActivity(id, actorId, 'PRIORITY_CHANGED', { from: existing.priority ?? null, to: patch.priority });

  return updated;
}

export async function deleteEpic(id) {
  await repo.deleteEpicById(id);
  return { message: 'Deleted' };
}

export async function bulkUpdateStatus(ids, status) {
  if (!Array.isArray(ids) || !ids.length || !status) throw fail('ids and status are required');
  await repo.bulkUpdateEpicStatus(ids, status);
  return { updated: ids.length };
}

// ── Feature linking ───────────────────────────────────────────────────────────

export async function linkFeature(epicId, featureId, actorId) {
  if (!featureId) throw fail('featureId is required');

  const linked = await repo.getLinkedFeatureOrders(epicId);
  const nextOrder = linked.length ? Math.max(...linked.map((f) => f.epicOrder)) + 1 : 0;

  await repo.linkFeatureToEpic(featureId, epicId, nextOrder);

  const isFirst = linked.length === 0;
  const epic = await repo.findEpicMeta(epicId);
  const suggestedStatus = isFirst && epic?.status === 'DRAFT' ? 'ACTIVE' : null;

  const feat = await repo.findFeatureById(featureId);
  await logEpicActivity(epicId, actorId, 'FEATURE_LINKED', { featureId, featureTitle: feat?.title ?? featureId });

  return { message: 'Feature linked', suggestedStatus };
}

export async function unlinkFeature(featureId, actorId) {
  const feat = await repo.findFeatureById(featureId);
  await repo.unlinkFeatureFromEpic(featureId);
  if (feat?.epicId) {
    await logEpicActivity(feat.epicId, actorId, 'FEATURE_UNLINKED', { featureId, featureTitle: feat?.title ?? featureId });
  }
  return { message: 'Feature unlinked' };
}

export async function reorderFeatures(epicId, order, actorId) {
  if (!Array.isArray(order) || !order.length) throw fail('order array is required');
  await Promise.all(order.map(({ id, order: o }) => repo.updateFeatureOrder(id, o)));
  await logEpicActivity(epicId, actorId, 'FEATURES_REORDERED', { count: order.length });
  return { message: 'Order saved' };
}

// ── Dependencies ──────────────────────────────────────────────────────────────

export async function addBlocker(epicId, blockerId) {
  if (!blockerId) throw fail('blockerId is required');
  if (blockerId === epicId) throw fail('An epic cannot block itself');

  const reverse = await repo.findDependency(blockerId, epicId);
  if (reverse) throw fail('Circular dependency detected');

  await repo.insertDependency(epicId, blockerId);
  return { message: 'Blocker added' };
}

export async function removeBlocker(epicId, blockerId) {
  await repo.deleteDependency(epicId, blockerId);
  return { message: 'Blocker removed' };
}

// ── Linked tickets ────────────────────────────────────────────────────────────

export async function listLinkedTickets(epicId) {
  return repo.findLinkedTickets(epicId);
}

export async function linkTicket(epicId, ticketId, actorId) {
  if (!ticketId) throw fail('ticketId is required');

  const epic   = await repo.findEpicMeta(epicId);
  if (!epic) throw fail('Epic not found', 404);

  const ticket = await repo.findTicketById(ticketId);
  if (!ticket) throw fail('Ticket not found', 404);

  await repo.linkTicketToEpic(ticketId, epicId);
  await logEpicActivity(epicId, actorId, 'TICKET_LINKED', { ticketId, ticketTitle: ticket.title });

  return { message: 'Ticket linked' };
}

export async function unlinkTicket(epicId, ticketId, actorId) {
  const ticket = await repo.findTicketById(ticketId);
  if (!ticket || ticket.epicId !== epicId) throw fail('Linked ticket not found', 404);

  await repo.unlinkTicketFromEpic(ticketId);
  await logEpicActivity(epicId, actorId, 'TICKET_UNLINKED', { ticketId, ticketTitle: ticket.title });

  return { message: 'Ticket unlinked' };
}

// ── Sub-epics ─────────────────────────────────────────────────────────────────

export async function listSubEpics(epicId) {
  const rows = await repo.findSubEpics(epicId);
  return attachProgress(rows);
}

// ── Auto-close check ──────────────────────────────────────────────────────────

export async function checkAutoClose(epicId) {
  const epic = await repo.findEpicMeta(epicId);
  if (!epic) throw fail('Epic not found', 404);

  if (epic.status === 'COMPLETED' || epic.status === 'CANCELLED') {
    return { eligible: false, reason: 'Epic already completed or cancelled' };
  }

  const features = await repo.findLinkedFeatureStatuses(epicId);
  const activeFeatures  = features.filter((f) => f.status !== 'DECLINED');
  const shippedFeatures = features.filter((f) => f.status === 'SHIPPED');

  if (!activeFeatures.length) {
    return { eligible: false, reason: 'No active features linked to this epic' };
  }

  if (shippedFeatures.length < activeFeatures.length) {
    const remaining = activeFeatures.length - shippedFeatures.length;
    return {
      eligible: false,
      reason: `${remaining} feature${remaining !== 1 ? 's' : ''} still pending (not SHIPPED)`,
      progress: { shipped: shippedFeatures.length, total: activeFeatures.length },
    };
  }

  const linkedTickets = await repo.findLinkedTicketStatuses(epicId);
  const openTickets   = linkedTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');

  if (openTickets.length) {
    return {
      eligible: false,
      reason: `${openTickets.length} linked ticket${openTickets.length !== 1 ? 's' : ''} still open`,
      openTickets: openTickets.length,
    };
  }

  return {
    eligible: true,
    message: 'All features shipped and tickets resolved. Epic ready for completion.',
    stats: { featuresShipped: shippedFeatures.length, ticketsResolved: linkedTickets.length },
  };
}

// ── Relations ─────────────────────────────────────────────────────────────────

const VALID_RELATION_TYPES = ['RELATES_TO', 'DUPLICATES', 'DEPENDS_ON', 'SPLIT_FROM'];

export async function listRelations(epicId) {
  return repo.findRelations(epicId);
}

export async function addRelation(epicId, targetEpicId, relationType = 'RELATES_TO') {
  if (!targetEpicId) throw fail('targetEpicId is required');
  if (targetEpicId === epicId) throw fail('An epic cannot relate to itself');
  if (!VALID_RELATION_TYPES.includes(relationType)) throw fail('Invalid relation type');

  const target = await repo.findEpicMeta(targetEpicId);
  if (!target) throw fail('Target epic not found', 404);

  const existing = await repo.findRelation(epicId, targetEpicId);
  if (existing) throw fail('Relation already exists', 409);

  return repo.insertRelation(epicId, targetEpicId, relationType);
}

export async function removeRelation(relationId) {
  await repo.deleteRelationById(relationId);
  return { message: 'Relation removed' };
}

// ── Network graph ─────────────────────────────────────────────────────────────

export async function getNetworkGraph(tenantId) {
  const nodes = await repo.findEpicsForGraph(tenantId ?? null);
  if (!nodes.length) return { nodes: [], edges: [] };

  const ids = nodes.map((n) => n.id);

  const [blockerEdges, relationEdges] = await Promise.all([
    repo.findBlockerEdges(ids),
    repo.findRelationEdges(ids),
  ]);

  const parentEdges = nodes
    .filter((n) => n.parentEpicId)
    .map((n) => ({ source: n.parentEpicId, target: n.id, type: 'PARENT_OF' }));

  return {
    nodes: nodes.map(({ parentEpicId: _, ...n }) => n),
    edges: [...blockerEdges, ...relationEdges, ...parentEdges],
  };
}

// ── Burndown chart ────────────────────────────────────────────────────────────

export async function getEpicBurndown(epicId) {
  const epic = await repo.findEpicMeta(epicId);
  if (!epic) throw fail('Epic not found', 404);

  // Need createdAt and targetDate — fetch full row
  const fullEpic = await repo.findEpicById(epicId);

  const features = await repo.findLinkedFeatureStatuses(epicId);
  const total = features.filter((f) => f.status !== 'DECLINED').length;

  const activityRows = await repo.findFeatureStatusChanges(epicId);

  // Track latest SHIPPED date per feature
  const featureShippedAt = {};
  for (const row of activityRows) {
    const { featureId, to, from } = row.meta ?? {};
    if (!featureId) continue;
    if (to === 'SHIPPED')   featureShippedAt[featureId] = row.createdAt;
    else if (from === 'SHIPPED') delete featureShippedAt[featureId];
  }

  // Build daily cumulative series
  const startDate = new Date(fullEpic.createdAt);
  startDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completionsByDay = {};
  for (const date of Object.values(featureShippedAt)) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    completionsByDay[key] = (completionsByDay[key] ?? 0) + 1;
  }

  const points = [];
  let cumulative = 0;
  const cursor = new Date(startDate);

  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    cumulative += completionsByDay[key] ?? 0;

    let ideal = null;
    if (fullEpic.targetDate && total > 0) {
      const end = new Date(fullEpic.targetDate);
      end.setHours(0, 0, 0, 0);
      const span    = end - startDate;
      const elapsed = cursor - startDate;
      ideal = span > 0 ? Math.min(total, Math.round((elapsed / span) * total * 10) / 10) : total;
    }

    points.push({ date: key, completed: cumulative, total, ideal });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Projected completion (7-day velocity extrapolation)
  let projectedDate = null;
  if (total > 0 && cumulative < total) {
    const recent   = points.slice(-7);
    const velocity = recent.length > 1
      ? (recent[recent.length - 1].completed - recent[0].completed) / (recent.length - 1)
      : 0;
    if (velocity > 0) {
      const remaining = total - cumulative;
      const daysLeft  = Math.ceil(remaining / velocity);
      const proj = new Date(today);
      proj.setDate(proj.getDate() + daysLeft);
      projectedDate = proj.toISOString().slice(0, 10);
    }
  }

  return {
    points,
    total,
    completed:   cumulative,
    projectedDate,
    startDate:   startDate.toISOString().slice(0, 10),
    targetDate:  fullEpic.targetDate ? new Date(fullEpic.targetDate).toISOString().slice(0, 10) : null,
  };
}
