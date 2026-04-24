/**
 * epics.repository.js
 * All database queries for the epics module.
 * No business logic — only data access.
 */

import { db } from '../../../config/database.js';
import { epics, epicDependencies, epicRelations } from './epics.schema.js';
import { featureRequests, featureSteps, featureVotes } from '../../features/features.schema.js';
import { tickets } from '../../tickets/tickets.schema.js';
import { users } from '../../users/users.schema.js';
import { applications } from '../../applications/applications.schema.js';
import { customers } from '../../customers/customers.schema.js';
import { epicActivity } from '../epicActivity/epicActivity.schema.js';
import { eq, desc, inArray, asc, and, sql } from 'drizzle-orm';

// ── Shared column selection ───────────────────────────────────────────────────

export const EPIC_SELECT = {
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

// ── Epic queries ──────────────────────────────────────────────────────────────

/** List all epics, optionally scoped to a tenant. */
export async function findAllEpics(tenantId) {
  const query = db.select(EPIC_SELECT).from(epics)
    .leftJoin(users, eq(epics.ownerId, users.id))
    .leftJoin(applications, eq(epics.applicationId, applications.id))
    .leftJoin(customers, eq(epics.customerId, customers.id))
    .orderBy(desc(epics.createdAt));

  return tenantId ? query.where(eq(epics.tenantId, tenantId)) : query;
}

/** Find a single epic by ID with joined owner/app/customer names. */
export async function findEpicById(id) {
  const rows = await db.select(EPIC_SELECT).from(epics)
    .leftJoin(users, eq(epics.ownerId, users.id))
    .leftJoin(applications, eq(epics.applicationId, applications.id))
    .leftJoin(customers, eq(epics.customerId, customers.id))
    .where(eq(epics.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Find a minimal epic row (id, status, priority, title, parentEpicId). */
export async function findEpicMeta(id) {
  const rows = await db
    .select({ id: epics.id, status: epics.status, priority: epics.priority, title: epics.title, parentEpicId: epics.parentEpicId })
    .from(epics).where(eq(epics.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Find sub-epics (children) of a given epic. */
export async function findSubEpics(parentId) {
  return db.select(EPIC_SELECT).from(epics)
    .leftJoin(users, eq(epics.ownerId, users.id))
    .leftJoin(applications, eq(epics.applicationId, applications.id))
    .leftJoin(customers, eq(epics.customerId, customers.id))
    .where(eq(epics.parentEpicId, parentId))
    .orderBy(asc(epics.createdAt));
}

/** Insert a new epic, returns the created row. */
export async function insertEpic(values) {
  const [row] = await db.insert(epics).values(values).returning();
  return row;
}

/** Update an epic by ID, returns the updated row. */
export async function updateEpicById(id, data) {
  const [row] = await db.update(epics)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(epics.id, id))
    .returning();
  return row ?? null;
}

/** Bulk update status for multiple epics. */
export async function bulkUpdateEpicStatus(ids, status) {
  await db.update(epics).set({ status, updatedAt: new Date() }).where(inArray(epics.id, ids));
}

/** Delete an epic by ID. */
export async function deleteEpicById(id) {
  await db.delete(epics).where(eq(epics.id, id));
}

// ── Hierarchy helpers ─────────────────────────────────────────────────────────

/**
 * Fetch parent epic titles for a set of parentEpicIds.
 * Returns a map: { [id]: { id, title, status } }
 */
export async function findParentEpicsByIds(ids) {
  if (!ids.length) return {};
  const rows = await db
    .select({ id: epics.id, title: epics.title, status: epics.status })
    .from(epics).where(inArray(epics.id, ids));
  return Object.fromEntries(rows.map((r) => [r.id, r]));
}

/**
 * Fetch all children for a set of epic IDs.
 * Returns an array of { id, title, status, priority, parentEpicId }.
 */
export async function findChildrenForEpics(epicIds) {
  if (!epicIds.length) return [];
  return db
    .select({ id: epics.id, title: epics.title, status: epics.status, priority: epics.priority, parentEpicId: epics.parentEpicId })
    .from(epics)
    .where(sql`${epics.parentEpicId} = ANY(ARRAY[${sql.join(epicIds.map((id) => sql`${id}::uuid`), sql`, `)}])`);
}

/**
 * Walk up the ancestor chain from a parentEpicId.
 * Returns ordered array from root → direct parent.
 */
export async function buildAncestorChain(parentEpicId) {
  const ancestors = [];
  let currentId = parentEpicId;
  const visited = new Set();
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const rows = await db
      .select({ id: epics.id, title: epics.title, status: epics.status, parentEpicId: epics.parentEpicId })
      .from(epics).where(eq(epics.id, currentId)).limit(1);
    if (!rows[0]) break;
    ancestors.unshift({ id: rows[0].id, title: rows[0].title, status: rows[0].status });
    currentId = rows[0].parentEpicId;
  }
  return ancestors;
}

// ── Progress / feature data ───────────────────────────────────────────────────

/** Fetch features + steps for a set of epic IDs (for progress calculation). */
export async function findFeaturesAndStepsForEpics(epicIds) {
  if (!epicIds.length) return { features: [], steps: [] };

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

  return { features, steps };
}

/** Fetch full feature detail for a single epic (for getEpic). */
export async function findEpicFeatures(epicId) {
  return db.select({
    id:              featureRequests.id,
    title:           featureRequests.title,
    description:     featureRequests.description,
    status:          featureRequests.status,
    epicOrder:       featureRequests.epicOrder,
    createdAt:       featureRequests.createdAt,
    applicationName: applications.name,
    customerName:    customers.name,
    submittedByName: users.name,
    applicationId:   featureRequests.applicationId,
    customerId:      featureRequests.customerId,
  }).from(featureRequests)
    .leftJoin(applications, eq(featureRequests.applicationId, applications.id))
    .leftJoin(customers, eq(featureRequests.customerId, customers.id))
    .leftJoin(users, eq(featureRequests.submittedById, users.id))
    .where(eq(featureRequests.epicId, epicId))
    .orderBy(asc(featureRequests.epicOrder), desc(featureRequests.createdAt));
}

/** Fetch vote counts for a set of feature IDs. */
export async function findVotesForFeatures(featureIds) {
  if (!featureIds.length) return [];
  return db
    .select({ featureRequestId: featureVotes.featureRequestId })
    .from(featureVotes)
    .where(inArray(featureVotes.featureRequestId, featureIds));
}

/** Update epicOrder for a feature. */
export async function updateFeatureOrder(featureId, order) {
  await db.update(featureRequests)
    .set({ epicOrder: order, updatedAt: new Date() })
    .where(eq(featureRequests.id, featureId));
}

/** Link a feature to an epic (set epicId + epicOrder). */
export async function linkFeatureToEpic(featureId, epicId, epicOrder) {
  await db.update(featureRequests)
    .set({ epicId, epicOrder, updatedAt: new Date() })
    .where(eq(featureRequests.id, featureId));
}

/** Unlink a feature from its epic. */
export async function unlinkFeatureFromEpic(featureId) {
  await db.update(featureRequests)
    .set({ epicId: null, updatedAt: new Date() })
    .where(eq(featureRequests.id, featureId));
}

/** Get current max epicOrder for features linked to an epic. */
export async function getLinkedFeatureOrders(epicId) {
  return db
    .select({ epicOrder: featureRequests.epicOrder })
    .from(featureRequests)
    .where(eq(featureRequests.epicId, epicId));
}

/** Find a feature by ID (minimal). */
export async function findFeatureById(id) {
  const rows = await db
    .select({ id: featureRequests.id, title: featureRequests.title, epicId: featureRequests.epicId })
    .from(featureRequests).where(eq(featureRequests.id, id)).limit(1);
  return rows[0] ?? null;
}

// ── Dependencies ──────────────────────────────────────────────────────────────

/** Find all blockers for an epic. */
export async function findBlockers(epicId) {
  return db.select().from(epicDependencies).where(eq(epicDependencies.epicId, epicId));
}

/** Find all epics this epic is blocking. */
export async function findBlocking(blockerId) {
  return db.select().from(epicDependencies).where(eq(epicDependencies.blockerId, blockerId));
}

/** Find a specific dependency row. */
export async function findDependency(epicId, blockerId) {
  const rows = await db.select().from(epicDependencies)
    .where(and(eq(epicDependencies.epicId, epicId), eq(epicDependencies.blockerId, blockerId)));
  return rows[0] ?? null;
}

/** Insert a dependency (epicId is blocked by blockerId). */
export async function insertDependency(epicId, blockerId) {
  await db.insert(epicDependencies).values({ epicId, blockerId }).onConflictDoNothing();
}

/** Delete a dependency. */
export async function deleteDependency(epicId, blockerId) {
  await db.delete(epicDependencies)
    .where(and(eq(epicDependencies.epicId, epicId), eq(epicDependencies.blockerId, blockerId)));
}

/** Fetch epic meta rows for a set of IDs (used to check blocker statuses). */
export async function findEpicsByIds(ids) {
  if (!ids.length) return [];
  return db
    .select({ id: epics.id, status: epics.status, title: epics.title })
    .from(epics).where(inArray(epics.id, ids));
}

// ── Relations ─────────────────────────────────────────────────────────────────

/** List outgoing + incoming relations for an epic. */
export async function findRelations(epicId) {
  const [outgoing, incoming] = await Promise.all([
    db.select({
      id:           epicRelations.id,
      relationType: epicRelations.relationType,
      direction:    sql`'outgoing'`,
      epicId:       epicRelations.targetEpicId,
      title:        epics.title,
      status:       epics.status,
      priority:     epics.priority,
    }).from(epicRelations)
      .leftJoin(epics, eq(epicRelations.targetEpicId, epics.id))
      .where(eq(epicRelations.sourceEpicId, epicId)),

    db.select({
      id:           epicRelations.id,
      relationType: epicRelations.relationType,
      direction:    sql`'incoming'`,
      epicId:       epicRelations.sourceEpicId,
      title:        epics.title,
      status:       epics.status,
      priority:     epics.priority,
    }).from(epicRelations)
      .leftJoin(epics, eq(epicRelations.sourceEpicId, epics.id))
      .where(eq(epicRelations.targetEpicId, epicId)),
  ]);

  return [...outgoing, ...incoming];
}

/** Find an existing relation between two epics. */
export async function findRelation(sourceEpicId, targetEpicId) {
  const rows = await db.select({ id: epicRelations.id }).from(epicRelations)
    .where(and(eq(epicRelations.sourceEpicId, sourceEpicId), eq(epicRelations.targetEpicId, targetEpicId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert a relation. */
export async function insertRelation(sourceEpicId, targetEpicId, relationType) {
  const [row] = await db.insert(epicRelations)
    .values({ sourceEpicId, targetEpicId, relationType })
    .returning();
  return row;
}

/** Delete a relation by ID. */
export async function deleteRelationById(relationId) {
  await db.delete(epicRelations).where(eq(epicRelations.id, relationId));
}

// ── Linked tickets ────────────────────────────────────────────────────────────

/** List tickets linked to an epic. */
export async function findLinkedTickets(epicId) {
  return db.select({
    id:             tickets.id,
    title:          tickets.title,
    status:         tickets.status,
    priority:       tickets.priority,
    createdAt:      tickets.createdAt,
    customerName:   customers.name,
    assignedToName: users.name,
  }).from(tickets)
    .leftJoin(customers, eq(tickets.customerId, customers.id))
    .leftJoin(users, eq(tickets.assignedToId, users.id))
    .where(eq(tickets.epicId, epicId))
    .orderBy(desc(tickets.createdAt));
}

/** Find a ticket by ID (minimal). */
export async function findTicketById(id) {
  const rows = await db
    .select({ id: tickets.id, title: tickets.title, epicId: tickets.epicId, status: tickets.status })
    .from(tickets).where(eq(tickets.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Link a ticket to an epic. */
export async function linkTicketToEpic(ticketId, epicId) {
  await db.update(tickets).set({ epicId, updatedAt: new Date() }).where(eq(tickets.id, ticketId));
}

/** Unlink a ticket from its epic. */
export async function unlinkTicketFromEpic(ticketId) {
  await db.update(tickets).set({ epicId: null, updatedAt: new Date() }).where(eq(tickets.id, ticketId));
}

/** Get all ticket statuses linked to an epic (for auto-close check). */
export async function findLinkedTicketStatuses(epicId) {
  return db.select({ status: tickets.status }).from(tickets).where(eq(tickets.epicId, epicId));
}

// ── Network graph ─────────────────────────────────────────────────────────────

/** Fetch all epics for the network graph, optionally tenant-scoped. */
export async function findEpicsForGraph(tenantId) {
  const query = db.select({
    id:           epics.id,
    title:        epics.title,
    status:       epics.status,
    priority:     epics.priority,
    featureCount: sql`0`,
    parentEpicId: epics.parentEpicId,
  }).from(epics);
  return tenantId ? query.where(eq(epics.tenantId, tenantId)) : query;
}

/** Fetch all blocker edges for a set of epic IDs. */
export async function findBlockerEdges(epicIds) {
  if (!epicIds.length) return [];
  return db.select({
    source: epicDependencies.blockerId,
    target: epicDependencies.epicId,
    type:   sql`'BLOCKS'`,
  }).from(epicDependencies)
    .where(sql`${epicDependencies.epicId} = ANY(ARRAY[${sql.join(epicIds.map((id) => sql`${id}::uuid`), sql`, `)}])`);
}

/** Fetch all relation edges for a set of epic IDs. */
export async function findRelationEdges(epicIds) {
  if (!epicIds.length) return [];
  return db.select({
    id:     epicRelations.id,
    source: epicRelations.sourceEpicId,
    target: epicRelations.targetEpicId,
    type:   epicRelations.relationType,
  }).from(epicRelations)
    .where(sql`${epicRelations.sourceEpicId} = ANY(ARRAY[${sql.join(epicIds.map((id) => sql`${id}::uuid`), sql`, `)}])`);
}

// ── Burndown ──────────────────────────────────────────────────────────────────

/** Fetch FEATURE_STATUS_CHANGED activity rows for burndown calculation. */
export async function findFeatureStatusChanges(epicId) {
  return db
    .select({ meta: epicActivity.meta, createdAt: epicActivity.createdAt })
    .from(epicActivity)
    .where(and(eq(epicActivity.epicId, epicId), eq(epicActivity.action, 'FEATURE_STATUS_CHANGED')))
    .orderBy(asc(epicActivity.createdAt));
}

/** Fetch feature statuses for auto-close check. */
export async function findLinkedFeatureStatuses(epicId) {
  return db
    .select({ id: featureRequests.id, status: featureRequests.status })
    .from(featureRequests)
    .where(eq(featureRequests.epicId, epicId));
}
