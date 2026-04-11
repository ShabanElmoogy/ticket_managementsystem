import { db } from '../../../config/database.js';
import { epics, epicDependencies } from './epics.schema.js';
import { featureRequests, featureSteps, featureVotes } from '../../features/features.schema.js';
import { tickets } from '../../tickets/tickets.schema.js';
import { users } from '../../users/users.schema.js';
import { applications } from '../../applications/applications.schema.js';
import { customers } from '../../customers/customers.schema.js';
import { eq, desc, inArray, asc, and, isNull } from 'drizzle-orm';
import { getTenantScope } from '../../../utils/tenantUtils.js';
import { logEpicActivity } from '../epicActivity/epicActivity.controller.js';

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
  targetDate:      epics.targetDate,
  createdAt:       epics.createdAt,
  updatedAt:       epics.updatedAt,
  ownerName:       users.name,
  applicationName: applications.name,
  customerName:    customers.name,
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
    res.json(await attachDependencies(withProgress));
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
    res.json({ ...withDeps, features: features.map((f) => ({ ...f, voteCount: votes.filter((v) => v.featureRequestId === f.id).length })) });
  } catch (err) {
    console.error('getEpic error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEpic = async (req, res) => {
  try {
    const { title, description, ownerId, applicationId, customerId, targetDate, priority, tags } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const [row] = await db.insert(epics).values({
      title: title.trim(), description: description?.trim() || null,
      priority: priority || 'MEDIUM',
      tags: Array.isArray(tags) ? tags : [],
      tenantId, ownerId: ownerId || null, applicationId: applicationId || null,
      customerId: customerId || null, targetDate: targetDate || null,
    }).returning();
    res.status(201).json({ ...row, ownerName: null, applicationName: null, customerName: null, featureCount: 0, stepsTotal: 0, stepsDone: 0, featureStatusCounts: {} });
  } catch (err) {
    console.error('createEpic error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEpic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, tags, ownerId, applicationId, customerId, targetDate } = req.body;
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
