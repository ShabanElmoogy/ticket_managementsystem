/**
 * docs.service.js
 * Business logic for the docs module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './docs.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Docs ──────────────────────────────────────────────────────────────────────

export async function listDocs(tenantId) {
  return repo.findAllDocs(tenantId ?? null);
}

export async function getDoc(id, tenantId) {
  const doc = await repo.findDocById(id, tenantId ?? null);
  if (!doc) throw fail('Doc not found', 404);
  return doc;
}

export async function createDoc(tenantId, { title, blocks = [] }) {
  return repo.insertDoc({
    title,
    blocks,
    ...(tenantId ? { tenantId } : {}),
  });
}

/**
 * Upsert a doc — update if it exists, insert if it doesn't.
 * This preserves the original behaviour where the frontend may PUT
 * a doc that hasn't been created yet (e.g. optimistic local ID).
 */
export async function upsertDoc(id, tenantId, { title, blocks = [] }) {
  const existing = await repo.findDocById(id, tenantId ?? null);

  if (existing) {
    const updated = await repo.updateDocById(id, tenantId ?? null, { title, blocks });
    return updated;
  }

  return repo.insertDoc({
    id,
    title: title ?? 'Untitled',
    blocks,
    ...(tenantId ? { tenantId } : {}),
  });
}

export async function deleteDoc(id, tenantId) {
  const existing = await repo.findDocById(id, tenantId ?? null);
  if (!existing) throw fail('Doc not found', 404);
  await repo.deleteDocById(id, tenantId ?? null);
  return { message: 'Doc deleted successfully' };
}

// ── Tree nodes ────────────────────────────────────────────────────────────────

export async function listTree(tenantId) {
  return repo.findAllNodes(tenantId ?? null);
}

export async function createFolder(tenantId, { title, parentId = null }) {
  const position = await repo.getNextPosition(parentId, tenantId ?? null);

  return repo.insertNode({
    type: 'FOLDER',
    title,
    parentId: parentId ?? null,
    position,
    ...(tenantId ? { tenantId } : {}),
  });
}

export async function createDocNode(tenantId, { title, parentId = null, docId = null }) {
  // If no docId provided, create a blank doc first
  let targetDocId = docId;
  if (!targetDocId) {
    const newDoc = await repo.insertDoc({
      title: title ?? 'Untitled',
      blocks: [],
      ...(tenantId ? { tenantId } : {}),
    });
    targetDocId = newDoc.id;
  }

  const position = await repo.getNextPosition(parentId, tenantId ?? null);

  return repo.insertNode({
    type: 'DOC',
    title: title ?? 'Untitled',
    parentId: parentId ?? null,
    position,
    docId: targetDocId,
    ...(tenantId ? { tenantId } : {}),
  });
}

export async function renameNode(id, tenantId, { title }) {
  const node = await repo.findNodeById(id, tenantId ?? null);
  if (!node) throw fail('Node not found', 404);

  const updated = await repo.updateNodeById(id, tenantId ?? null, { title });

  // Mirror title to the linked doc
  if (updated.type === 'DOC' && updated.docId) {
    await repo.updateDocById(updated.docId, tenantId ?? null, { title });
  }

  return updated;
}

export async function moveNode(id, tenantId, { newParentId, newPosition }) {
  const node = await repo.findNodeById(id, tenantId ?? null);
  if (!node) throw fail('Node not found', 404);

  await repo.moveNodeTransaction(node, newParentId ?? null, newPosition);

  const updated = await repo.findNodeById(id, tenantId ?? null);
  return updated;
}

export async function deleteNode(id, tenantId) {
  // Collect all doc IDs in the subtree before deleting nodes
  const docIds = await repo.collectSubtreeDocIds(id, tenantId ?? null);

  // Delete node (children cascade) + orphaned docs in one transaction
  await repo.deleteNodeWithDocs(id, docIds, tenantId ?? null);

  return { message: 'Node deleted successfully' };
}
