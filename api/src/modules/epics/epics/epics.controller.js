import { db } from '../../../config/database.js';
import { epics, epicDependencies, epicRelations } from './epics.schema.js';
import { featureRequests, featureSteps, featureVotes } from '../../features/features.schema.js';
import { tickets } from '../../tickets/tickets.schema.js';
import { users } from '../../users/users.schema.js';
import { applications } from '../../applications/applications.schema.js';
import { customers } from '../../customers/customers.schema.js';
import { eq, desc, inArray, asc, and, sql } from 'drizzle-orm';
import { getTenantScope } from '../../../utils/tenantUtils.js';
import { logEpicActivity } from '../epicActivity/epicActivity.controller.js';
import { epicActivity } from '../epicActivity/epicActivity.schema.js';

const EPIC_SELECT = {
  id:              epics.id,
  title:           epics.title,
  description:     epics.description,
  status:          epics.status,
  priority:        epics.priority,
  tags:            epics.tags,
  tenantId:        epics.tenantId,
  ownerId:         epics.ownerId,
  applicationId:   epics.applicationId,
  customerId:      epics.customerId,
  parentEpicId:    epics.parentEpicId,
  targetDate:      epics.targetDate,
  estimatedDays:   epics.estimatedDays,
  createdAt:       epics.createdAt,
  updatedAt:       epics.updatedAt,
  ownerName:       users.name,
  applicationName: applications.name,
  customerName:    customers.name,
};

// Attach parent epic title and sub-epics list to rows
const attachHierarchy = async (rows) => {
  if (!rows.length) return rows.map((r) => ({ ...r, parentEpic: null, subEpics: [] }));

  // Fetch parent titles
  const parentIds = [...new Set(rows.map((r) => r.parentEpicId).filter(Boolean))];
  const parentRows = parentIds.length
    ? await db.select({ id: epics.id, title: epics.title, status: epics.status })
        .from(epics).where(inArray(epics.id, parentIds))
    : [];
  const parentById = Object.fromEntries(parentRows.map((p) => [p.id, p]));

  // Fetch sub-epics for each row
  const ids = rows.map((r) => r.id);
  const children = ids.length
    ? await db.select({ id: epics.id, title: epics.title, status: epics.status, priority: epics.priority, parentEpicId: epics.parentEpicId })
        .from(epics)
        .where(sql`${epics.parentEpicId} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}::uuid`), sql`, `)}])`)
    : [];

  return rows.map((r) => ({
    ...r,
    parentEpic: r.parentEpicId ? (parentById[r.parentEpicId] ?? null) : null,
    subEpics: children.filter((c) => c.parentEpicId === r.id),
  }));
};

// Build breadcrumb ancestors chain (parent → grandparent → …)
const buildAncestors = async (parentEpicId) => {
  const ancestors = [];
  let currentId = parentEpicId;
  const visited = new Set();
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const [row] = await db.select({ id: epics.id, title: epics.title, status: epics.status, parentEpicId: epics.parentEpicId })
      .from(epics).where(eq(epics.id, currentId)).limit(1);
    if (!row) break;
    ancestors.unshift({ id: row.id, title: row.title, status: row.status });
    currentId = row.parentEpicId;
  }
  return ancestors;
};

const attachDependencies = async (rows) => {
  if (!rows.length) return rows.map((r) => ({ ...r, blockedBy: [], blocking: [] }));
  const ids = rows.map((r) => r.id);
  const deps = await db.select().from(epicDependencies)
    .where(inArray(epicDependencies.epicId, ids));
  const blocking = await db.select().from(epicDependencies)
    .where(inArray(epicDependencies.blockerId, ids));
  // Fetch titles for referenced epics
  const refIds = [...new Set([...deps.map((d) => d.blockerId), ...blocking.map((d) => d.epicId)])];
  const refEpics = refIds.length
    ? await db.select({ id: epics.id, title: epics.title, status: epics.status }).from(epics).where(inArray(epics.id, refIds))
    : [];
  const byId = Object.fromEntries(refEpics.map((e) => [e.id, e]));
  return rows.map((r) => ({
    ...r,
    blockedBy: deps.filter((d) => d.epicId === r.id).map((d) => byId[d.blockerId]).filter(Boolean),
    blocking:  blocking.filter((d) => d.blockerId === r.id).map((d) => byId[d.epicId]).filter(Boolean),
  }));
};

const attachProgress = async (rows) => {
  if (!rows.length) return rows.map((r) => ({ ...r, featureCount: 0, stepsTotal: 0, stepsDone: 0 }));
  const epicIds = rows.map((r) => r.id);
  const features = await db
    .select({ id: featureRequests.id, epicId: featureRequests.epicId, status: featureRequests.status })
    .from(featureRequests)
    .where(inArray(featureRequests.epicId, epicIds));
  const featureIds = features.map((f) => f.id);
  const steps = featureIds.length
    ? await db
        .select({ featureRequestId: featureSteps.featureRequestId, status: featureSteps.status })
        .from(featureSteps)
        .where(inArray(featureSteps.featureRequestId, featureIds))
    : [];
  return rows.map((r) => {
    const epicFeatures = features.filter((f) => f.epicId === r.id);
    const epicFeatureIds = epicFeatures.map((f) => f.id);
    const epicSteps = steps.filter((s) => epicFeatureIds.includes(s.featureRequestId));
    const featureStatusCounts = epicFeatures.reduce((acc, f) => { acc[f.status] = (acc[f.status] ?? 0) + 1; return acc; }, {});
    const stepsTotal = epicSteps.length;
    const stepsDone = epicSteps.filter((s) => s.status === 'DONE').length;
    // When no steps exist, derive progress from feature statuses (SHIPPED = done, DECLINED = excluded)
    const activeFeatures = epicFeatures.filter((f) => f.status !== 'DECLINED');
    const shippedFeatures = epicFeatures.filter((f) => f.status === 'SHIPPED').length;
    const derivedTotal = stepsTotal || activeFeatures.length;
    const derivedDone = stepsTotal ? stepsDone : shippedFeatures;
    return { ...r, featureCount: epicFeatures.length, stepsTotal: derivedTotal, stepsDone: derivedDone, featureStatusCounts };
  });
};

export const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length || !status)
      return res.status(400).json({ error: 'ids and status are required' });
    await db.update(epics).set({ status, updatedAt: new Date() }).where(inArray(epics.id, ids));
    res.json({ updated: ids.length });
  } catch (err) {
    console.error('bulkUpdateStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listEpics = async (req, res) => {
  try {
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const query = db.select(EPIC_SELECT).from(epics)
      .leftJoin(users, eq(epics.ownerId, users.id))
      .leftJoin(applications, eq(epics.applicationId, applications.id))
      .leftJoin(customers, eq(epics.customerId, customers.id))
      .orderBy(desc(epics.createdAt));
    const rows = tenantId ? await query.where(eq(epics.tenantId, tenantId)) : await query;
    const withProgress = await attachProgress(rows);
    const withDeps = await attachDependencies(withProgress);
    res.json(await attachHierarchy(withDeps));
  } catch (err) {
    console.error('listEpics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEpic = async (req, res) => {
  try {
    const { id } = req.params;
    const [row] = await db.select(EPIC_SELECT).from(epics)
      .leftJoin(users, eq(epics.ownerId, users.id))
      .leftJoin(applications, eq(epics.applicationId, applications.id))
      .leftJoin(customers, eq(epics.customerId, customers.id))
      .where(eq(epics.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: 'Epic not found' });
    const [withProgress] = await attachProgress([row]);
    const [withDeps] = await attachDependencies([withProgress]);
    const [withHierarchy] = await attachHierarchy([withDeps]);

    // Build full ancestor breadcrumb chain
    const ancestors = await buildAncestors(row.parentEpicId);

    // Attach sub-epics with progress
    const subEpicRows = await db.select(EPIC_SELECT).from(epics)
      .leftJoin(users, eq(epics.ownerId, users.id))
      .leftJoin(applications, eq(epics.applicationId, applications.id))
      .leftJoin(customers, eq(epics.customerId, customers.id))
      .where(eq(epics.parentEpicId, id));
    const subEpicsWithProgress = await attachProgress(subEpicRows);

    const features = await db.select({
      id: featureRequests.id, title: featureRequests.title, description: featureRequests.description,
      status: featureRequests.status, epicOrder: featureRequests.epicOrder, createdAt: featureRequests.createdAt,
      applicationName: applications.name, customerName: customers.name, submittedByName: users.name,
      applicationId: featureRequests.applicationId, customerId: featureRequests.customerId,
    }).from(featureRequests)
      .leftJoin(applications, eq(featureRequests.applicationId, applications.id))
      .leftJoin(customers, eq(featureRequests.customerId, customers.id))
      .leftJoin(users, eq(featureRequests.submittedById, users.id))
      .where(eq(featureRequests.epicId, id))
      .orderBy(asc(featureRequests.epicOrder), desc(featureRequests.createdAt));
    const featureIds = features.map((f) => f.id);
    const votes = featureIds.length
      ? await db.select({ featureRequestId: featureVotes.featureRequestId }).from(featureVotes).where(inArray(featureVotes.featureRequestId, featureIds))
      : [];
    if (features.length > 1 && features.every((f) => f.epicOrder === 0)) {
      await Promise.all(features.map((f, i) => db.update(featureRequests).set({ epicOrder: i }).where(eq(featureRequests.id, f.id))));
      features.forEach((f, i) => { f.epicOrder = i; });
    }
    res.json({
      ...withHierarchy,
      ancestors,
      subEpics: subEpicsWithProgress,
      features: features.map((f) => ({ ...f, voteCount: votes.filter((v) => v.featureRequestId === f.id).length })),
    });
  } catch (err) {
    console.error('getEpic error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEpic = async (req, res) => {
  try {
    const { title, description, ownerId, applicationId, customerId, targetDate, priority, tags, estimatedDays, parentEpicId } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
    // Validate parent epic exists if provided
    if (parentEpicId) {
      const [parent] = await db.select({ id: epics.id }).from(epics).where(eq(epics.id, parentEpicId)).limit(1);
      if (!parent) return res.status(400).json({ error: 'Parent epic not found' });
    }
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const [row] = await db.insert(epics).values({
      title: title.trim(), description: description?.trim() || null,
      priority: priority || 'MEDIUM',
      tags: Array.isArray(tags) ? tags : [],
      tenantId, ownerId: ownerId || null, applicationId: applicationId || null,
      customerId: customerId || null, targetDate: targetDate || null,
      estimatedDays: estimatedDays ? parseInt(estimatedDays, 10) : null,
      parentEpicId: parentEpicId || null,
    }).returning();
    res.status(201).json({ ...row, ownerName: null, applicationName: null, customerName: null, featureCount: 0, stepsTotal: 0, stepsDone: 0, featureStatusCounts: {}, parentEpic: null, subEpics: [], ancestors: [] });
  } catch (err) {
    console.error('createEpic error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEpic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, tags, ownerId, applicationId, customerId, targetDate, estimatedDays } = req.body;
    const [existing] = await db.select({ id: epics.id, status: epics.status, priority: epics.priority }).from(epics).where(eq(epics.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Epic not found' });
    const patch = { updatedAt: new Date() };
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description || null;
    if (status !== undefined) {
      if (status === 'COMPLETED') {
        const blockers = await db.select().from(epicDependencies).where(eq(epicDependencies.epicId, id));
        if (blockers.length) {
          const blockerEpics = await db.select({ id: epics.id, status: epics.status, title: epics.title })
            .from(epics).where(inArray(epics.id, blockers.map((b) => b.blockerId)));
          const unresolved = blockerEpics.filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED');
          if (unresolved.length)
            return res.status(400).json({ error: `Blocked by unresolved epic${unresolved.length > 1 ? 's' : ''}: ${unresolved.map((e) => e.title).join(', ')}` });
        }
      }
      patch.status = status;
    }
    if (ownerId !== undefined) patch.ownerId = ownerId || null;
    if (applicationId !== undefined) patch.applicationId = applicationId || null;
    if (customerId !== undefined) patch.customerId = customerId || null;
    if (priority !== undefined) patch.priority = priority;
    if (tags !== undefined) patch.tags = Array.isArray(tags) ? tags : [];
    if (targetDate !== undefined) patch.targetDate = targetDate || null;
    if (estimatedDays !== undefined) patch.estimatedDays = estimatedDays ? parseInt(estimatedDays, 10) : null;
    if (req.body.parentEpicId !== undefined) {
      const newParentId = req.body.parentEpicId || null;
      // Prevent circular: a parent cannot be one of its own descendants
      if (newParentId) {
        if (newParentId === id) return res.status(400).json({ error: 'An epic cannot be its own parent' });
        // Walk up the proposed parent's ancestors to check for cycles
        const ancestors = await buildAncestors(newParentId);
        if (ancestors.some((a) => a.id === id))
          return res.status(400).json({ error: 'Circular parent relationship detected' });
        const [parent] = await db.select({ id: epics.id }).from(epics).where(eq(epics.id, newParentId)).limit(1);
        if (!parent) return res.status(400).json({ error: 'Parent epic not found' });
      }
      patch.parentEpicId = newParentId;
    }
    const [updated] = await db.update(epics).set(patch).where(eq(epics.id, id)).returning();
    const actorId = req.user?.userId ?? req.user?.id;
    if (patch.status) await logEpicActivity(id, actorId, 'STATUS_CHANGED', { from: existing.status ?? null, to: patch.status });
    if (patch.title) await logEpicActivity(id, actorId, 'TITLE_CHANGED', { to: patch.title });
    if (patch.priority) await logEpicActivity(id, actorId, 'PRIORITY_CHANGED', { from: existing.priority ?? null, to: patch.priority });
    res.json(updated);
  } catch (err) {
    console.error('updateEpic error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEpic = async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(epics).where(eq(epics.id, id));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteEpic error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const linkFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { featureId } = req.body;
    if (!featureId) return res.status(400).json({ error: 'featureId is required' });
    const linked = await db.select({ epicOrder: featureRequests.epicOrder }).from(featureRequests).where(eq(featureRequests.epicId, id));
    const nextOrder = linked.length ? Math.max(...linked.map((f) => f.epicOrder)) + 1 : 0;
    await db.update(featureRequests).set({ epicId: id, epicOrder: nextOrder, updatedAt: new Date() }).where(eq(featureRequests.id, featureId));
    const isFirst = linked.length === 0;
    const [epic] = await db.select({ status: epics.status }).from(epics).where(eq(epics.id, id)).limit(1);
    const suggestedStatus = isFirst && epic?.status === 'DRAFT' ? 'ACTIVE' : null;
    const actorId = req.user?.userId ?? req.user?.id;
    const [feat] = await db.select({ title: featureRequests.title }).from(featureRequests).where(eq(featureRequests.id, featureId)).limit(1);
    await logEpicActivity(id, actorId, 'FEATURE_LINKED', { featureId, featureTitle: feat?.title ?? featureId });
    res.json({ message: 'Feature linked', suggestedStatus });
  } catch (err) {
    console.error('linkFeature error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const reorderFeatures = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0)
      return res.status(400).json({ error: 'order array is required' });
    const { id: epicId } = req.params;
    await Promise.all(order.map(({ id, order: o }) =>
      db.update(featureRequests).set({ epicOrder: o, updatedAt: new Date() }).where(eq(featureRequests.id, id))
    ));
    const actorId = req.user?.userId ?? req.user?.id;
    await logEpicActivity(epicId, actorId, 'FEATURES_REORDERED', { count: order.length });
    res.json({ message: 'Order saved' });
  } catch (err) {
    console.error('reorderFeatures error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unlinkFeature = async (req, res) => {
  try {
    const { featureId } = req.params;
    const [feat] = await db.select({ title: featureRequests.title, epicId: featureRequests.epicId }).from(featureRequests).where(eq(featureRequests.id, featureId)).limit(1);
    await db.update(featureRequests).set({ epicId: null, updatedAt: new Date() }).where(eq(featureRequests.id, featureId));
    const actorId = req.user?.userId ?? req.user?.id;
    if (feat?.epicId) await logEpicActivity(feat.epicId, actorId, 'FEATURE_UNLINKED', { featureId, featureTitle: feat?.title ?? featureId });
    res.json({ message: 'Feature unlinked' });
  } catch (err) {
    console.error('unlinkFeature error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addBlocker = async (req, res) => {
  try {
    const { id } = req.params;
    const { blockerId } = req.body;
    if (!blockerId) return res.status(400).json({ error: 'blockerId is required' });
    if (blockerId === id) return res.status(400).json({ error: 'An epic cannot block itself' });
    // Prevent circular: check if id is already a blocker of blockerId
    const reverse = await db.select().from(epicDependencies)
      .where(and(eq(epicDependencies.epicId, blockerId), eq(epicDependencies.blockerId, id)));
    if (reverse.length) return res.status(400).json({ error: 'Circular dependency detected' });
    await db.insert(epicDependencies).values({ epicId: id, blockerId }).onConflictDoNothing();
    res.json({ message: 'Blocker added' });
  } catch (err) {
    console.error('addBlocker error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeBlocker = async (req, res) => {
  try {
    const { id, blockerId } = req.params;
    await db.delete(epicDependencies)
      .where(and(eq(epicDependencies.epicId, id), eq(epicDependencies.blockerId, blockerId)));
    res.json({ message: 'Blocker removed' });
  } catch (err) {
    console.error('removeBlocker error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listLinkedTickets = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select({
      id:            tickets.id,
      title:         tickets.title,
      status:        tickets.status,
      priority:      tickets.priority,
      createdAt:     tickets.createdAt,
      customerName:  customers.name,
      assignedToName: users.name,
    }).from(tickets)
      .leftJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(users, eq(tickets.assignedToId, users.id))
      .where(eq(tickets.epicId, id))
      .orderBy(desc(tickets.createdAt));
    res.json(rows);
  } catch (err) {
    console.error('listLinkedTickets error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const linkTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { ticketId } = req.body;
    if (!ticketId) return res.status(400).json({ error: 'ticketId is required' });
    const [epic] = await db.select({ id: epics.id }).from(epics).where(eq(epics.id, id)).limit(1);
    if (!epic) return res.status(404).json({ error: 'Epic not found' });
    const [ticket] = await db.select({ id: tickets.id, title: tickets.title }).from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    await db.update(tickets).set({ epicId: id, updatedAt: new Date() }).where(eq(tickets.id, ticketId));
    const actorId = req.user?.userId ?? req.user?.id;
    await logEpicActivity(id, actorId, 'TICKET_LINKED', { ticketId, ticketTitle: ticket.title });
    res.json({ message: 'Ticket linked' });
  } catch (err) {
    console.error('linkTicket error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unlinkTicket = async (req, res) => {
  try {
    const { id, ticketId } = req.params;
    const [ticket] = await db.select({ id: tickets.id, title: tickets.title, epicId: tickets.epicId }).from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    if (!ticket || ticket.epicId !== id) return res.status(404).json({ error: 'Linked ticket not found' });
    await db.update(tickets).set({ epicId: null, updatedAt: new Date() }).where(eq(tickets.id, ticketId));
    const actorId = req.user?.userId ?? req.user?.id;
    await logEpicActivity(id, actorId, 'TICKET_UNLINKED', { ticketId, ticketTitle: ticket.title });
    res.json({ message: 'Ticket unlinked' });
  } catch (err) {
    console.error('unlinkTicket error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
export const listSubEpics = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select(EPIC_SELECT).from(epics)
      .leftJoin(users, eq(epics.ownerId, users.id))
      .leftJoin(applications, eq(epics.applicationId, applications.id))
      .leftJoin(customers, eq(epics.customerId, customers.id))
      .where(eq(epics.parentEpicId, id))
      .orderBy(asc(epics.createdAt));
    const withProgress = await attachProgress(rows);
    res.json(withProgress);
  } catch (err) {
    console.error('listSubEpics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkAutoClose = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get epic with features and linked tickets
    const [epic] = await db.select({ id: epics.id, status: epics.status, title: epics.title }).from(epics).where(eq(epics.id, id)).limit(1);
    if (!epic) return res.status(404).json({ error: 'Epic not found' });
    
    if (epic.status === 'COMPLETED' || epic.status === 'CANCELLED') {
      return res.json({ eligible: false, reason: 'Epic already completed or cancelled' });
    }

    // Check all linked features are SHIPPED
    const features = await db.select({ status: featureRequests.status }).from(featureRequests).where(eq(featureRequests.epicId, id));
    const activeFeatures = features.filter(f => f.status !== 'DECLINED');
    const shippedFeatures = features.filter(f => f.status === 'SHIPPED');
    
    if (activeFeatures.length === 0) {
      return res.json({ eligible: false, reason: 'No active features linked to this epic' });
    }
    
    if (shippedFeatures.length < activeFeatures.length) {
      const remaining = activeFeatures.length - shippedFeatures.length;
      return res.json({ 
        eligible: false, 
        reason: `${remaining} feature${remaining !== 1 ? 's' : ''} still pending (not SHIPPED)`,
        progress: { shipped: shippedFeatures.length, total: activeFeatures.length }
      });
    }

    // Check all linked tickets are RESOLVED or CLOSED
    const linkedTickets = await db.select({ status: tickets.status }).from(tickets).where(eq(tickets.epicId, id));
    const openTickets = linkedTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
    
    if (openTickets.length > 0) {
      return res.json({ 
        eligible: false, 
        reason: `${openTickets.length} linked ticket${openTickets.length !== 1 ? 's' : ''} still open`,
        openTickets: openTickets.length
      });
    }

    // All conditions met
    res.json({ 
      eligible: true, 
      message: 'All features shipped and tickets resolved. Epic ready for completion.',
      stats: {
        featuresShipped: shippedFeatures.length,
        ticketsResolved: linkedTickets.length
      }
    });
  } catch (err) {
    console.error('checkAutoClose error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Epic Relations (soft links) ──────────────────────────────────────────────

const RELATION_LABELS = {
  RELATES_TO:  'Relates to',
  DUPLICATES:  'Duplicates',
  DEPENDS_ON:  'Depends on',
  SPLIT_FROM:  'Split from',
};

export const listRelations = async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch both directions
    const outgoing = await db
      .select({
        id:           epicRelations.id,
        relationType: epicRelations.relationType,
        direction:    sql`'outgoing'`,
        epicId:       epicRelations.targetEpicId,
        title:        epics.title,
        status:       epics.status,
        priority:     epics.priority,
      })
      .from(epicRelations)
      .leftJoin(epics, eq(epicRelations.targetEpicId, epics.id))
      .where(eq(epicRelations.sourceEpicId, id));

    const incoming = await db
      .select({
        id:           epicRelations.id,
        relationType: epicRelations.relationType,
        direction:    sql`'incoming'`,
        epicId:       epicRelations.sourceEpicId,
        title:        epics.title,
        status:       epics.status,
        priority:     epics.priority,
      })
      .from(epicRelations)
      .leftJoin(epics, eq(epicRelations.sourceEpicId, epics.id))
      .where(eq(epicRelations.targetEpicId, id));

    res.json([...outgoing, ...incoming]);
  } catch (err) {
    console.error('listRelations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addRelation = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetEpicId, relationType = 'RELATES_TO' } = req.body;
    if (!targetEpicId) return res.status(400).json({ error: 'targetEpicId is required' });
    if (targetEpicId === id) return res.status(400).json({ error: 'An epic cannot relate to itself' });

    const validTypes = ['RELATES_TO', 'DUPLICATES', 'DEPENDS_ON', 'SPLIT_FROM'];
    if (!validTypes.includes(relationType)) return res.status(400).json({ error: 'Invalid relation type' });

    // Check target exists
    const [target] = await db.select({ id: epics.id }).from(epics).where(eq(epics.id, targetEpicId)).limit(1);
    if (!target) return res.status(404).json({ error: 'Target epic not found' });

    // Prevent duplicate
    const existing = await db.select({ id: epicRelations.id }).from(epicRelations)
      .where(and(eq(epicRelations.sourceEpicId, id), eq(epicRelations.targetEpicId, targetEpicId)))
      .limit(1);
    if (existing.length) return res.status(409).json({ error: 'Relation already exists' });

    const [row] = await db.insert(epicRelations).values({
      sourceEpicId: id,
      targetEpicId,
      relationType,
    }).returning();

    res.status(201).json(row);
  } catch (err) {
    console.error('addRelation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeRelation = async (req, res) => {
  try {
    const { relationId } = req.params;
    await db.delete(epicRelations).where(eq(epicRelations.id, relationId));
    res.json({ message: 'Relation removed' });
  } catch (err) {
    console.error('removeRelation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Network graph data: nodes = all epics, edges = dependencies + relations
export const getNetworkGraph = async (req, res) => {
  try {
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const query = db.select({
      id: epics.id, title: epics.title, status: epics.status, priority: epics.priority,
      featureCount: sql`0`, parentEpicId: epics.parentEpicId,
    }).from(epics);
    const nodes = tenantId ? await query.where(eq(epics.tenantId, tenantId)) : await query;

    const ids = nodes.map((n) => n.id);
    if (!ids.length) return res.json({ nodes: [], edges: [] });

    // Blocker edges
    const blockerEdges = await db.select({
      source: epicDependencies.blockerId,
      target: epicDependencies.epicId,
      type:   sql`'BLOCKS'`,
    }).from(epicDependencies)
      .where(sql`${epicDependencies.epicId} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}::uuid`), sql`, `)}])`);

    // Relation edges
    const relationEdges = await db.select({
      id:     epicRelations.id,
      source: epicRelations.sourceEpicId,
      target: epicRelations.targetEpicId,
      type:   epicRelations.relationType,
    }).from(epicRelations)
      .where(sql`${epicRelations.sourceEpicId} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}::uuid`), sql`, `)}])`);

    // Parent edges
    const parentEdges = nodes
      .filter((n) => n.parentEpicId)
      .map((n) => ({ source: n.parentEpicId, target: n.id, type: 'PARENT_OF' }));

    res.json({
      nodes: nodes.map(({ parentEpicId: _, ...n }) => n),
      edges: [...blockerEdges, ...relationEdges, ...parentEdges],
    });
  } catch (err) {
    console.error('getNetworkGraph error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Burndown Chart ────────────────────────────────────────────────────────────
// Returns daily snapshots of completed vs total features/steps from epic start
export const getEpicBurndown = async (req, res) => {
  try {
    const { id } = req.params;

    const [epic] = await db
      .select({ id: epics.id, createdAt: epics.createdAt, targetDate: epics.targetDate })
      .from(epics)
      .where(eq(epics.id, id))
      .limit(1);
    if (!epic) return res.status(404).json({ error: 'Epic not found' });

    // All features linked to this epic
    const features = await db
      .select({ id: featureRequests.id, status: featureRequests.status, createdAt: featureRequests.createdAt })
      .from(featureRequests)
      .where(eq(featureRequests.epicId, id));

    const total = features.filter((f) => f.status !== 'DECLINED').length;

    // FEATURE_STATUS_CHANGED events → derive when each feature reached SHIPPED
    const activityRows = await db
      .select({ meta: epicActivity.meta, createdAt: epicActivity.createdAt })
      .from(epicActivity)
      .where(and(eq(epicActivity.epicId, id), eq(epicActivity.action, 'FEATURE_STATUS_CHANGED')))
      .orderBy(asc(epicActivity.createdAt));

    // Track latest SHIPPED date per feature (a feature can be un-shipped and re-shipped)
    const featureShippedAt = {};
    for (const row of activityRows) {
      const { featureId, to, from } = row.meta ?? {};
      if (!featureId) continue;
      if (to === 'SHIPPED') {
        featureShippedAt[featureId] = row.createdAt;
      } else if (from === 'SHIPPED') {
        // un-shipped — remove
        delete featureShippedAt[featureId];
      }
    }

    // Build daily cumulative series
    const startDate = new Date(epic.createdAt);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group completions by date string
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

      // Ideal burnup line: linear from 0 to total over [startDate, targetDate]
      let ideal = null;
      if (epic.targetDate && total > 0) {
        const end = new Date(epic.targetDate);
        end.setHours(0, 0, 0, 0);
        const span = end - startDate;
        const elapsed = cursor - startDate;
        ideal = span > 0 ? Math.min(total, Math.round((elapsed / span) * total * 10) / 10) : total;
      }

      points.push({ date: key, completed: cumulative, total, ideal });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Projected completion date (linear extrapolation from last 7 days velocity)
    let projectedDate = null;
    if (total > 0 && cumulative < total) {
      const recent = points.slice(-7);
      const velocity = recent.length > 1
        ? (recent[recent.length - 1].completed - recent[0].completed) / (recent.length - 1)
        : 0;
      if (velocity > 0) {
        const remaining = total - cumulative;
        const daysLeft = Math.ceil(remaining / velocity);
        const proj = new Date(today);
        proj.setDate(proj.getDate() + daysLeft);
        projectedDate = proj.toISOString().slice(0, 10);
      }
    }

    res.json({ points, total, completed: cumulative, projectedDate, startDate: startDate.toISOString().slice(0, 10), targetDate: epic.targetDate ? new Date(epic.targetDate).toISOString().slice(0, 10) : null });
  } catch (err) {
    console.error('getEpicBurndown error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
