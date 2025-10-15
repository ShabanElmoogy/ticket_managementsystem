import { Router } from 'express';
import {
  listDocs,
  getDoc,
  createDoc,
  updateDoc,
  deleteDoc,
  listTree,
  createFolder,
  createDocNode,
  renameNode,
  moveNode,
  deleteNode,
} from '../controllers/docController.js';

const router = Router();

// Docs
router.get('/docs', listDocs);
router.get('/docs/:id', getDoc);
router.post('/docs', createDoc);
router.put('/docs/:id', updateDoc);
router.delete('/docs/:id', deleteDoc);

// Tree
router.get('/tree', listTree);
router.post('/tree/folder', createFolder);
router.post('/tree/doc', createDocNode);
router.put('/tree/:id/rename', renameNode);
router.put('/tree/:id/move', moveNode);
router.delete('/tree/:id', deleteNode);

export default router;
