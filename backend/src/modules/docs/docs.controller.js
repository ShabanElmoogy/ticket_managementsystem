import { db } from '../../config/database.js';
import { docs, docNodes } from './docs.schema.js';
import { eq, desc, asc, gt, gte, isNull, inArray, max, and } from 'drizzle-orm';
import Boom from '@hapi/boom';

// Docs CRUD
export const listDocs = async (req, res, next) => {
  try {
    const docsData = await db.select().from(docs).orderBy(desc(docs.updatedAt));
    res.json(docsData);
  } catch (err) { next(err); }
};

export const getDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [doc] = await db.select().from(docs).where(eq(docs.id, id)).limit(1);
    if (!doc) return next(Boom.notFound('Doc not found'));
    res.json(doc);
  } catch (err) { next(err); }
};

export const createDoc = async (req, res, next) => {
  try {
    const { title, blocks } = req.body;
    const [doc] = await db.insert(docs).values({ 
      title, 
      blocks: blocks || [] 
    }).returning();
    res.status(201).json(doc);
  } catch (err) { next(err); }
};

export const updateDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, blocks } = req.body;
    
    // Check if doc exists
    const [existingDoc] = await db.select().from(docs).where(eq(docs.id, id)).limit(1);
    
    let doc;
    if (existingDoc) {
      [doc] = await db.update(docs).set({ 
        title, 
        blocks: blocks || [] 
      }).where(eq(docs.id, id)).returning();
    } else {
      [doc] = await db.insert(docs).values({ 
        id, 
        title: title || 'Untitled', 
        blocks: blocks || [] 
      }).returning();
    }
    
    res.json(doc);
  } catch (err) { next(err); }
};

export const deleteDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.delete(docs).where(eq(docs.id, id));
    res.status(204).end();
  } catch (err) { next(err); }
};

// Tree nodes CRUD
export const listTree = async (req, res, next) => {
  try {
    // Return flat array of nodes - frontend will build the tree structure
    const nodes = await db.select().from(docNodes).orderBy(asc(docNodes.position));
    res.json(nodes);
  } catch (err) { next(err); }
};

export const createFolder = async (req, res, next) => {
  try {
    const { title, parentId } = req.body;
    
    // Get max position under parent
    const whereClause = parentId ? eq(docNodes.parentId, parentId) : isNull(docNodes.parentId);
    const [maxPosResult] = await db.select({ maxPos: max(docNodes.position) }).from(docNodes).where(whereClause);
    const position = (maxPosResult.maxPos ?? -1) + 1;
    
    const [node] = await db.insert(docNodes).values({
      type: 'FOLDER',
      title,
      parentId: parentId ?? null,
      position
    }).returning();
    
    res.status(201).json(node);
  } catch (err) { next(err); }
};

export const createDocNode = async (req, res, next) => {
  try {
    const { title, parentId, docId } = req.body;
    
    let targetDocId = docId;
    if (!targetDocId) {
      const [newDoc] = await db.insert(docs).values({ title: title || 'Untitled', blocks: [] }).returning();
      targetDocId = newDoc.id;
    }
    
    const whereClause = parentId ? eq(docNodes.parentId, parentId) : isNull(docNodes.parentId);
    const [maxPosResult] = await db.select({ maxPos: max(docNodes.position) }).from(docNodes).where(whereClause);
    const position = (maxPosResult.maxPos ?? -1) + 1;
    
    const [node] = await db.insert(docNodes).values({
      type: 'DOC',
      title: title || 'Untitled',
      parentId: parentId ?? null,
      position,
      docId: targetDocId
    }).returning();
    
    res.status(201).json(node);
  } catch (err) { next(err); }
};

export const renameNode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const [node] = await db.update(docNodes).set({ title }).where(eq(docNodes.id, id)).returning();
    
    // if doc node, mirror to doc.title
    if (node.type === 'DOC' && node.docId) {
      await db.update(docs).set({ title }).where(eq(docs.id, node.docId));
    }
    
    res.json(node);
  } catch (err) { next(err); }
};

export const moveNode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newParentId, newPosition } = req.body;
    
    const [node] = await db.select().from(docNodes).where(eq(docNodes.id, id)).limit(1);
    if (!node) return next(Boom.notFound('Node not found'));

    // Use transaction for atomic operations
    await db.transaction(async (tx) => {
      // Decrement positions of old siblings after this node
      const oldParentClause = node.parentId ? eq(docNodes.parentId, node.parentId) : isNull(docNodes.parentId);
      await tx.update(docNodes)
        .set({ position: docNodes.position - 1 })
        .where(and(oldParentClause, gt(docNodes.position, node.position)));
      
      // Increment positions at destination
      const newParentClause = newParentId ? eq(docNodes.parentId, newParentId) : isNull(docNodes.parentId);
      await tx.update(docNodes)
        .set({ position: docNodes.position + 1 })
        .where(and(newParentClause, gte(docNodes.position, newPosition)));
      
      // Update the node itself
      await tx.update(docNodes)
        .set({ parentId: newParentId ?? null, position: newPosition })
        .where(eq(docNodes.id, id));
    });

    const [updated] = await db.select().from(docNodes).where(eq(docNodes.id, id)).limit(1);
    res.json(updated);
  } catch (err) { next(err); }
};

export const deleteNode = async (req, res, next) => {
  try {
    const { id } = req.params;

    // collect all docIds in the subtree BEFORE deleting nodes
    const collectDocIdsRecursively = async (nodeId) => {
      const [node] = await db.select().from(docNodes).where(eq(docNodes.id, nodeId)).limit(1);
      if (!node) return [];
      
      let ids = [];
      if (node.type === 'DOC' && node.docId) ids.push(node.docId);
      
      const children = await db.select().from(docNodes).where(eq(docNodes.parentId, nodeId));
      for (const child of children) {
        const childIds = await collectDocIdsRecursively(child.id);
        if (childIds.length) ids = ids.concat(childIds);
      }
      return ids;
    };

    const docIds = await collectDocIdsRecursively(id);

    await db.transaction(async (tx) => {
      // delete the node (children will cascade via onDelete: Cascade)
      await tx.delete(docNodes).where(eq(docNodes.id, id));
      
      if (docIds.length) {
        // remove documents now that nodes are gone
        await tx.delete(docs).where(inArray(docs.id, docIds));
      }
    });

    res.status(204).end();
  } catch (err) { next(err); }
};
