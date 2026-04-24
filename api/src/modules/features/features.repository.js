/**
 * features.repository.js
 * All database queries for the features module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { featureRequests, featureSteps, featureVotes } from './features.schema.js';
import { users } from '../users/users.schema.js';
import { applications } from '../applications/applications.schema.js';
import { customers } from '../customers/customers.schema.js';
import { epics } from '../epics/epics/epics.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { eq, desc, and, asc, inArray } from 'drizzle-orm';

// ── Shared column selection ───────────────────────────────────────────────────

const FEATURE_SELECT = {
  id:             featureRequests.id,
  title:          featureRequests.title,
  description:    featureRequests.description,
  status:         featureRequests.status,
  tenantId:       featureRequests.tenantId,
  linkedTicketId: featureRequests.linkedTicketId,
  applicationId:  featureRequests.applicationId,
  customerId:     featureRequests.customerId,
  epicId:         featureRequests.epicId,
  epicOrder:      featureRequests.epicOrder,
  createdAt:      featureRequests.createdAt,
  updatedAt:      featureRequests.updatedAt,
  submittedBy:    { id: users.id, name: users.name, email: users.email },
  applicationName: applications.name,
  customerName:   customers.name,
  epicTitle:      epics.title,
};

// ── Feature queries ───────────────────────────────────────────────────────────

/** List all features, optionally scoped to a tenant. */
export async function findAllFeatures(tenantId) {
  const query = db
    .select(FEATURE_SELECT)
    .from(featureRequests)
    .innerJoin(users, eq(featureRequests.submittedById, users.id))
    .leftJoin(applications, eq(featureRequests.applicationId, applications.id))
    .leftJoin(customers, eq(featureRequests.customerId, customers.id))
    .leftJoin(epics, eq(featureRequests.epicId, epics.id))
    .orderBy(desc(featureRequests.createdAt));

  return tenantId ? query.where(eq(featureRequests.tenantId, tenantId)) : query;
}

/** Find a single feature by ID with all joins. */
export async function findFeatureById(id) {
  const rows = await db
    .select(FEATURE_SELECT)
    .from(featureRequests)
    .innerJoin(users, eq(featureRequests.submittedById, users.id))
    .leftJoin(applications, eq(featureRequests.applicationId, applications.id))
    .leftJoin(customers, eq(featureRequests.customerId, customers.id))
    .leftJoin(epics, eq(featureRequests.epicId, epics.id))
    .where(eq(featureRequests.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Find a feature's minimal fields (id, status, epicId, title). */
export async function findFeatureMeta(id) {
  const rows = await db
    .select({ id: featureRequests.id, status: featureRequests.status, epicId: featureRequests.epicId, title: featureRequests.title })
    .from(featureRequests)
    .where(eq(featureRequests.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert a new feature, returns the created row. */
export async function insertFeature(values) {
  const [row] = await db.insert(featureRequests).values(values).returning();
  return row;
}

/** Update a feature by ID, returns the updated row. */
export async function updateFeatureById(id, data) {
  const [row] = await db
    .update(featureRequests)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(featureRequests.id, id))
    .returning();
  return row ?? null;
}

/** Delete a feature by ID. */
export async function deleteFeatureById(id) {
  await db.delete(featureRequests).where(eq(featureRequests.id, id));
}

// ── Vote queries ──────────────────────────────────────────────────────────────

/**
 * Fetch all votes for a set of feature IDs.
 * Returns a flat array of { featureRequestId, userId }.
 */
export async function findVotesForFeatures(featureIds) {
  if (!featureIds.length) return [];
  return db
    .select({ featureRequestId: featureVotes.featureRequestId, userId: featureVotes.userId })
    .from(featureVotes)
    .where(inArray(featureVotes.featureRequestId, featureIds));
}

/** Find an existing vote by featureRequestId + userId. */
export async function findVote(featureRequestId, userId) {
  const rows = await db
    .select({ id: featureVotes.id })
    .from(featureVotes)
    .where(and(eq(featureVotes.featureRequestId, featureRequestId), eq(featureVotes.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert a vote. */
export async function insertVote(featureRequestId, userId) {
  await db.insert(featureVotes).values({ featureRequestId, userId });
}

/** Delete a vote by ID. */
export async function deleteVoteById(id) {
  await db.delete(featureVotes).where(eq(featureVotes.id, id));
}

/** Count all votes for a feature. */
export async function countVotes(featureRequestId) {
  const rows = await db
    .select({ userId: featureVotes.userId })
    .from(featureVotes)
    .where(eq(featureVotes.featureRequestId, featureRequestId));
  return rows.length;
}

// ── Epic-related queries (used for auto-completion logic) ─────────────────────

/** Find an epic's minimal fields (ownerId, title, status, tenantId). */
export async function findEpicMeta(epicId) {
  const rows = await db
    .select({ ownerId: epics.ownerId, title: epics.title, status: epics.status, tenantId: epics.tenantId })
    .from(epics)
    .where(eq(epics.id, epicId))
    .limit(1);
  return rows[0] ?? null;
}

/** Get all feature statuses linked to an epic. */
export async function findFeatureStatusesByEpicId(epicId) {
  return db
    .select({ status: featureRequests.status })
    .from(featureRequests)
    .where(eq(featureRequests.epicId, epicId));
}

/** Get all ticket statuses linked to an epic. */
export async function findTicketStatusesByEpicId(epicId) {
  return db
    .select({ status: tickets.status })
    .from(tickets)
    .where(eq(tickets.epicId, epicId));
}

/** Get the epicAutoClose setting for a tenant. */
export async function findTenantAutoCloseSetting(tenantId) {
  const rows = await db
    .select({ epicAutoClose: tenants.epicAutoClose })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return rows[0]?.epicAutoClose ?? true;
}

/** Mark an epic as COMPLETED. */
export async function completeEpic(epicId) {
  await db.update(epics).set({ status: 'COMPLETED', updatedAt: new Date() }).where(eq(epics.id, epicId));
}

// ── Feature steps ─────────────────────────────────────────────────────────────

/** List all steps for a feature, ordered by position. */
export async function findStepsByFeatureId(featureRequestId) {
  return db
    .select()
    .from(featureSteps)
    .where(eq(featureSteps.featureRequestId, featureRequestId))
    .orderBy(asc(featureSteps.order));
}

/** Find a step by ID. */
export async function findStepById(stepId) {
  const rows = await db
    .select()
    .from(featureSteps)
    .where(eq(featureSteps.id, stepId))
    .limit(1);
  return rows[0] ?? null;
}

/** Get the next available order position for a feature's steps. */
export async function getNextStepOrder(featureRequestId) {
  const rows = await db
    .select({ order: featureSteps.order })
    .from(featureSteps)
    .where(eq(featureSteps.featureRequestId, featureRequestId))
    .orderBy(asc(featureSteps.order));
  return rows.length ? rows[rows.length - 1].order + 1 : 0;
}

/** Insert a new step, returns the created row. */
export async function insertStep(values) {
  const [row] = await db.insert(featureSteps).values(values).returning();
  return row;
}

/** Update a step by ID, returns the updated row. */
export async function updateStepById(stepId, data) {
  const [row] = await db
    .update(featureSteps)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(featureSteps.id, stepId))
    .returning();
  return row ?? null;
}

/** Delete a step by ID. */
export async function deleteStepById(stepId) {
  await db.delete(featureSteps).where(eq(featureSteps.id, stepId));
}

/** Get all step statuses for a feature (used for auto-promotion check). */
export async function findStepStatusesByFeatureId(featureRequestId) {
  return db
    .select({ status: featureSteps.status })
    .from(featureSteps)
    .where(eq(featureSteps.featureRequestId, featureRequestId));
}

/** Enrich steps with user + ticket data in 2 batch queries. */
export async function enrichSteps(rows) {
  if (!rows.length) return [];

  const userIds   = [...new Set(rows.flatMap((r) => [r.assignedToId, r.assignedProgrammerId]).filter(Boolean))];
  const ticketIds = [...new Set(rows.map((r) => r.linkedTicketId).filter(Boolean))];

  const [enrichedUsers, enrichedTickets] = await Promise.all([
    userIds.length
      ? db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(inArray(users.id, userIds))
      : [],
    ticketIds.length
      ? db.select({ id: tickets.id, title: tickets.title }).from(tickets).where(inArray(tickets.id, ticketIds))
      : [],
  ]);

  const userMap   = Object.fromEntries(enrichedUsers.map((u) => [u.id, u]));
  const ticketMap = Object.fromEntries(enrichedTickets.map((t) => [t.id, t]));

  return rows.map((r) => ({
    ...r,
    assignedTo:         r.assignedToId         ? (userMap[r.assignedToId]         ?? null) : null,
    assignedProgrammer: r.assignedProgrammerId  ? (userMap[r.assignedProgrammerId] ?? null) : null,
    linkedTicket:       r.linkedTicketId        ? (ticketMap[r.linkedTicketId]     ?? null) : null,
  }));
}
