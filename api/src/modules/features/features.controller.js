import { db } from '../../config/database.js';
import { featureRequests, featureVotes } from './features.schema.js';
import { users } from '../users/users.schema.js';
import { applications } from '../applications/applications.schema.js';
import { customers } from '../customers/customers.schema.js';
import { epics } from '../epics/epics/epics.schema.js';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { getTenantScope } from '../../utils/tenantUtils.js';

const FEATURE_SELECT = {
  id:              featureRequests.id,
  title:           featureRequests.title,
  description:     featureRequests.description,
  status:          featureRequests.status,
  tenantId:        featureRequests.tenantId,
  linkedTicketId:  featureRequests.linkedTicketId,
  applicationId:   featureRequests.applicationId,
  customerId:      featureRequests.customerId,
  epicId:          featureRequests.epicId,
  createdAt:       featureRequests.createdAt,
  updatedAt:       featureRequests.updatedAt,
  submittedBy:     { id: users.id, name: users.name, email: users.email },
  applicationName: applications.name,
  customerName:    customers.name,
  epicTitle:       epics.title,
};

const attachVotes = async (rows, userId) => {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const allVotes = await db
    .select({ featureRequestId: featureVotes.featureRequestId, userId: featureVotes.userId })
    .from(featureVotes)
    .where(inArray(featureVotes.featureRequestId, ids));

  return rows.map((r) => ({
    ...r,
    voteCount: allVotes.filter((v) => v.featureRequestId === r.id).length,
    votedByMe: allVotes.some((v) => v.featureRequestId === r.id && v.userId === userId),
  }));
};

export const listFeatures = async (req, res) => {
  try {
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const query = db
      .select(FEATURE_SELECT)
      .from(featureRequests)
      .innerJoin(users, eq(featureRequests.submittedById, users.id))
      .leftJoin(applications, eq(featureRequests.applicationId, applications.id))
      .leftJoin(customers, eq(featureRequests.customerId, customers.id))
      .leftJoin(epics, eq(featureRequests.epicId, epics.id))
      .orderBy(desc(featureRequests.createdAt));

    const rows = tenantId
      ? await query.where(eq(featureRequests.tenantId, tenantId))
      : await query;

    res.json(await attachVotes(rows, req.user.userId));
  } catch (err) {
    console.error('listFeatures error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const [row] = await db
      .select(FEATURE_SELECT)
      .from(featureRequests)
      .innerJoin(users, eq(featureRequests.submittedById, users.id))
      .leftJoin(applications, eq(featureRequests.applicationId, applications.id))
      .leftJoin(customers, eq(featureRequests.customerId, customers.id))
      .leftJoin(epics, eq(featureRequests.epicId, epics.id))
      .where(eq(featureRequests.id, id))
      .limit(1);

    if (!row) return res.status(404).json({ error: 'Feature request not found' });

    const [result] = await attachVotes([row], req.user.userId);
    res.json(result);
  } catch (err) {
    console.error('getFeature error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createFeature = async (req, res) => {
  try {
    const { title, description, applicationId, customerId } = req.body;
    if (!title?.trim() || !description?.trim())
      return res.status(400).json({ error: 'title and description are required' });

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const [row] = await db
      .insert(featureRequests)
      .values({
        title: title.trim(),
        description: description.trim(),
        tenantId,
        submittedById: req.user.userId,
        applicationId: applicationId || null,
        customerId: customerId || null,
      })
      .returning();

    res.status(201).json({ ...row, voteCount: 0, votedByMe: false, applicationName: null, customerName: null });
  } catch (err) {
    console.error('createFeature error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, linkedTicketId, applicationId, customerId } = req.body;

    const [existing] = await db
      .select({ id: featureRequests.id })
      .from(featureRequests)
      .where(eq(featureRequests.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ error: 'Feature request not found' });

    const patch = { updatedAt: new Date() };
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description;
    if (status !== undefined) patch.status = status;
    if (linkedTicketId !== undefined) patch.linkedTicketId = linkedTicketId || null;
    if (applicationId !== undefined) patch.applicationId = applicationId || null;
    if (customerId !== undefined) patch.customerId = customerId || null;

    const [updated] = await db
      .update(featureRequests)
      .set(patch)
      .where(eq(featureRequests.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error('updateFeature error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(featureRequests).where(eq(featureRequests.id, id));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteFeature error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleVote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [existing] = await db
      .select({ id: featureVotes.id })
      .from(featureVotes)
      .where(and(eq(featureVotes.featureRequestId, id), eq(featureVotes.userId, userId)))
      .limit(1);

    if (existing) {
      await db.delete(featureVotes).where(eq(featureVotes.id, existing.id));
    } else {
      await db.insert(featureVotes).values({ featureRequestId: id, userId });
    }

    const votes = await db
      .select({ userId: featureVotes.userId })
      .from(featureVotes)
      .where(eq(featureVotes.featureRequestId, id));

    res.json({ voteCount: votes.length, votedByMe: !existing });
  } catch (err) {
    console.error('toggleVote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
