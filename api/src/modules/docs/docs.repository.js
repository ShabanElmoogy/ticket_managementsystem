/**
 * docs.repository.js
 * All database queries for the docs module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { docs, docNodes } from './docs.schema.js';
import { eq, and, asc, desc, gt, gte, isNull, inArray, max } from 'drizzle-orm';

// ── Docs ──────────────────────────────────────────────────────────────────────

/** List all docs, optionally scoped to a tenant. */
export async function findAllDocs(tenantId) {
  return tenantId
    ? db.select().from(docs).where(eq(docs.tenantId, tenantId)).orderBy(desc(docs.updatedAt))
    : db.select().from(docs).orderBy(desc(docs.updatedAt));
}

/** Find a single doc by ID, optionally scoped to a tenant. */
export async function findDocById(id, tenantId) {
  const where = tenantId
    ? and(eq(docs.id, id), eq(docs.tenantId, tenantId))
    : eq(docs.id, id);

  const rows = await db.select().from(docs).where(where).limit(1);
  return rows[0] ?? null;
}

/** Insert a new doc, returns the created row. */
export async function insertDoc(values) {
  const [doc] = await db.insert(docs).values(values).returning();
  return doc;
}

/** Update a doc by ID (optionally tenant-scoped), returns the updated row. */
export async function updateDocById(id, tenantId, data) {
  const where = tenantId
    ? and(eq(docs.id, id), eq(docs.tenantId, tenantId))
    : eq(docs.id, id);

  const [doc] = await db.update(docs).set(data).where(where).returning();
  return doc ?? null;
}

/** Delete a doc by ID (optionally tenant-scoped). */
export async function deleteDocById(id, tenantId) {
  const where = tenantId
    ? and(eq(docs.id, id), eq(docs.tenantId, tenantId))
    : eq(docs.id, id);

  await db.delete(docs).where(where);
}

/** Delete multiple docs by IDs (optionally tenant-scoped). Used in subtree delete. */
export async function deleteDocsByIds(ids, tenantId) {
  if (!ids.length) return;
  const where = tenantId
    ? and(inArray(docs.id, ids), eq(docs.tenantId, tenantId))
    : inArray(docs.id, ids);

  await db.delete(docs).where(where);
}

// ── Doc nodes ─────────────────────────────────────────────────────────────────

/** List all nodes flat, optionally scoped to a tenant. */
export async function findAllNodes(tenantId) {
  return tenantId
    ? db.select().from(docNodes).where(eq(docNodes.tenantId, tenantId)).orderBy(asc(docNodes.position))
    : db.select().from(docNodes).orderBy(asc(docNodes.position));
}

/** Find a single node by ID, optionally scoped to a tenant. */
export async function findNodeById(id, tenantId) {
  const where = tenantId
    ? and(eq(docNodes.id, id), eq(docNodes.tenantId, tenantId))
    : eq(docNodes.id, id);

  const rows = await db.select().from(docNodes).where(where).limit(1);
  return rows[0] ?? null;
}

/** Find all direct children of a node, optionally scoped to a tenant. */
export async function findChildNodes(parentId, tenantId) {
  const parentClause = parentId ? eq(docNodes.parentId, parentId) : isNull(docNodes.parentId);
  const where = tenantId ? and(parentClause, eq(docNodes.tenantId, tenantId)) : parentClause;
  return db.select().from(docNodes).where(where);
}

/**
 * Get the next available position under a parent (max + 1).
 * Returns 0 if no siblings exist yet.
 */
export async function getNextPosition(parentId, tenantId) {
  const parentClause = parentId ? eq(docNodes.parentId, parentId) : isNull(docNodes.parentId);
  const where = tenantId ? and(parentClause, eq(docNodes.tenantId, tenantId)) : parentClause;

  const [result] = await db.select({ maxPos: max(docNodes.position) }).from(docNodes).where(where);
  return (result?.maxPos ?? -1) + 1;
}

/** Insert a new node, returns the created row. */
export async function insertNode(values) {
  const [node] = await db.insert(docNodes).values(values).returning();
  return node;
}

/** Update a node by ID (optionally tenant-scoped), returns the updated row. */
export async function updateNodeById(id, tenantId, data) {
  const where = tenantId
    ? and(eq(docNodes.id, id), eq(docNodes.tenantId, tenantId))
    : eq(docNodes.id, id);

  const [node] = await db.update(docNodes).set(data).where(where).returning();
  return node ?? null;
}

/** Delete a node by ID (optionally tenant-scoped). Children cascade via FK. */
export async function deleteNodeById(id, tenantId) {
  const where = tenantId
    ? and(eq(docNodes.id, id), eq(docNodes.tenantId, tenantId))
    : eq(docNodes.id, id);

  await db.delete(docNodes).where(where);
}

/**
 * Move a node atomically:
 * 1. Decrement positions of old siblings after the node.
 * 2. Increment positions at the destination.
 * 3. Update the node's parentId + position.
 */
export async function moveNodeTransaction(node, newParentId, newPosition) {
  await db.transaction(async (tx) => {
    // Shift old siblings down
    const oldParentClause = node.parentId ? eq(docNodes.parentId, node.parentId) : isNull(docNodes.parentId);
    await tx.update(docNodes)
      .set({ position: docNodes.position - 1 })
      .where(and(oldParentClause, gt(docNodes.position, node.position)));

    // Shift new siblings up
    const newParentClause = newParentId ? eq(docNodes.parentId, newParentId) : isNull(docNodes.parentId);
    await tx.update(docNodes)
      .set({ position: docNodes.position + 1 })
      .where(and(newParentClause, gte(docNodes.position, newPosition)));

    // Place the node
    await tx.update(docNodes)
      .set({ parentId: newParentId ?? null, position: newPosition })
      .where(eq(docNodes.id, node.id));
  });
}

/**
 * Recursively collect all docIds in a subtree rooted at nodeId.
 * Used before deleting a folder so we can clean up orphaned docs.
 */
export async function collectSubtreeDocIds(nodeId, tenantId) {
  const where = tenantId
    ? and(eq(docNodes.id, nodeId), eq(docNodes.tenantId, tenantId))
    : eq(docNodes.id, nodeId);

  const rows = await db.select().from(docNodes).where(where).limit(1);
  const node = rows[0] ?? null;
  if (!node) return [];

  const ids = node.type === 'DOC' && node.docId ? [node.docId] : [];

  const children = await findChildNodes(nodeId, tenantId);
  for (const child of children) {
    const childIds = await collectSubtreeDocIds(child.id, tenantId);
    ids.push(...childIds);
  }

  return ids;
}

/**
 * Delete a node and all its orphaned docs in a single transaction.
 * Children cascade automatically via the FK onDelete: cascade.
 */
export async function deleteNodeWithDocs(nodeId, docIds, tenantId) {
  await db.transaction(async (tx) => {
    const nodeWhere = tenantId
      ? and(eq(docNodes.id, nodeId), eq(docNodes.tenantId, tenantId))
      : eq(docNodes.id, nodeId);

    await tx.delete(docNodes).where(nodeWhere);

    if (docIds.length) {
      const docsWhere = tenantId
        ? and(inArray(docs.id, docIds), eq(docs.tenantId, tenantId))
        : inArray(docs.id, docIds);

      await tx.delete(docs).where(docsWhere);
    }
  });
}
