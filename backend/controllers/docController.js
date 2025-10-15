import { prisma } from '../config/database.js';
import Boom from '@hapi/boom';

// Docs CRUD
export const listDocs = async (req, res, next) => {
  try {
    const docs = await prisma.doc.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json(docs);
  } catch (err) { next(err); }
};

export const getDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await prisma.doc.findUnique({ where: { id } });
    if (!doc) return next(Boom.notFound('Doc not found'));
    res.json(doc);
  } catch (err) { next(err); }
};

export const createDoc = async (req, res, next) => {
  try {
    const { title, blocks } = req.body;
    const doc = await prisma.doc.create({ data: { title, blocks: blocks ?? [] } });
    res.status(201).json(doc);
  } catch (err) { next(err); }
};

export const updateDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, blocks } = req.body;
    const doc = await prisma.doc.upsert({
      where: { id },
      update: { title, blocks },
      create: { id, title: title || 'Untitled', blocks: blocks ?? [] },
    });
    res.json(doc);
  } catch (err) { next(err); }
};

export const deleteDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.doc.delete({ where: { id } });
    res.status(204).end();
  } catch (err) { next(err); }
};

// Tree nodes CRUD
export const listTree = async (req, res, next) => {
  try {
    const nodes = await prisma.docNode.findMany({ orderBy: [{ parentId: 'asc' }, { position: 'asc' }] });
    res.json(nodes);
  } catch (err) { next(err); }
};

export const createFolder = async (req, res, next) => {
  try {
    const { title, parentId } = req.body;
    // determine position as last under parent
    const maxPos = await prisma.docNode.aggregate({ _max: { position: true }, where: { parentId: parentId ?? null } });
    const position = (maxPos._max.position ?? -1) + 1;
    const node = await prisma.docNode.create({ data: { type: 'FOLDER', title, parentId: parentId ?? null, position } });
    res.status(201).json(node);
  } catch (err) { next(err); }
};

export const createDocNode = async (req, res, next) => {
  try {
    const { title, parentId, docId } = req.body;
    const targetDocId = docId || (await prisma.doc.create({ data: { title: title || 'Untitled', blocks: [] } })).id;
    const maxPos = await prisma.docNode.aggregate({ _max: { position: true }, where: { parentId: parentId ?? null } });
    const position = (maxPos._max.position ?? -1) + 1;
    const node = await prisma.docNode.create({ data: { type: 'DOC', title: title || 'Untitled', parentId: parentId ?? null, position, docId: targetDocId } });
    res.status(201).json(node);
  } catch (err) { next(err); }
};

export const renameNode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const node = await prisma.docNode.update({ where: { id }, data: { title } });
    // if doc node, mirror to doc.title
    if (node.type === 'DOC' && node.docId) {
      await prisma.doc.update({ where: { id: node.docId }, data: { title } });
    }
    res.json(node);
  } catch (err) { next(err); }
};

export const moveNode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newParentId, newPosition } = req.body;
    // To reposition, shift siblings positions if needed
    const node = await prisma.docNode.findUnique({ where: { id } });
    if (!node) return next(Boom.notFound('Node not found'));

    // Decrement positions of old siblings after this node
    await prisma.$transaction(async (tx) => {
      await tx.docNode.updateMany({
        where: { parentId: node.parentId, position: { gt: node.position } },
        data: { position: { decrement: 1 } },
      });
      // Increment positions at destination
      await tx.docNode.updateMany({
        where: { parentId: newParentId ?? null, position: { gte: newPosition } },
        data: { position: { increment: 1 } },
      });
      await tx.docNode.update({ where: { id }, data: { parentId: newParentId ?? null, position: newPosition } });
    });

    const updated = await prisma.docNode.findUnique({ where: { id } });
    res.json(updated);
  } catch (err) { next(err); }
};

export const deleteNode = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Cascade delete handled via relations
    await prisma.docNode.delete({ where: { id } });
    res.status(204).end();
  } catch (err) { next(err); }
};
