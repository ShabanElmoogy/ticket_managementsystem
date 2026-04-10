import { db } from '../../../config/database.js';
import { epics } from './epics.schema.js';
import { featureRequests, featureSteps, featureVotes } from '../../features/features.schema.js';
import { users } from '../../users/users.schema.js';
import { applications } from '../../applications/applications.schema.js';
import { customers } from '../../customers/customers.schema.js';
import { eq, desc, inArray, asc } from 'drizzle-orm';
import { getTenantScope } from '../../../utils/tenantUtils.js';

const EPIC_SELECT = {
  id:              epics.id,
  title:           epics.title,
  description:     epics.description,
  status:          epics.status,
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
    res.json(await attachProgress(rows));
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
    res.json({ ...withProgress, features: features.map((f) => ({ ...f, voteCount: votes.filter((v) => v.featureRequestId === f.id).length })) });
  } catch (err) {
    console.error('getEpic error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEpic = async (req, res) => {
  try {
    const { title, description, ownerId, applicationId, customerId, targetDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const [row] = await db.insert(epics).values({
      title: title.trim(), description: description?.trim() || null,
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
    const { title, description, status, ownerId, applicationId, customerId, targetDate } = req.body;
    const [existing] = await db.select({ id: epics.id }).from(epics).where(eq(epics.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Epic not found' });
    const patch = { updatedAt: new Date() };
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description || null;
    if (status !== undefined) patch.status = status;
    if (ownerId !== undefined) patch.ownerId = ownerId || null;
    if (applicationId !== undefined) patch.applicationId = applicationId || null;
    if (customerId !== undefined) patch.customerId = customerId || null;
    if (targetDate !== undefined) patch.targetDate = targetDate || null;
    const [updated] = await db.update(epics).set(patch).where(eq(epics.id, id)).returning();
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
    res.json({ message: 'Feature linked' });
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
    await Promise.all(order.map(({ id, order: o }) =>
      db.update(featureRequests).set({ epicOrder: o, updatedAt: new Date() }).where(eq(featureRequests.id, id))
    ));
    res.json({ message: 'Order saved' });
  } catch (err) {
    console.error('reorderFeatures error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unlinkFeature = async (req, res) => {
  try {
    const { featureId } = req.params;
    await db.update(featureRequests).set({ epicId: null, updatedAt: new Date() }).where(eq(featureRequests.id, featureId));
    res.json({ message: 'Feature unlinked' });
  } catch (err) {
    console.error('unlinkFeature error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
