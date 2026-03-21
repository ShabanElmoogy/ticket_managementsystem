import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { listDocs, getDoc, createDoc, updateDoc, deleteDoc, listTree, createFolder, createDocNode, renameNode, moveNode, deleteNode } from './docs.controller.js';

const router = express.Router();

// Apply authentication middleware to all routes (same pattern as tasks)
router.use(authenticateToken);

// Reads
router.get('/', listDocs);
router.get('/tree', listTree);
router.get('/tree/list', listTree);
router.get('/:id', getDoc);

// Writes (tenant admins only)
router.post('/', requireTenantAdmin, createDoc);
router.put('/:id', requireTenantAdmin, updateDoc);
router.delete('/:id', requireTenantAdmin, deleteDoc);

router.post('/tree/folder', requireTenantAdmin, createFolder);
router.post('/tree/doc', requireTenantAdmin, createDocNode);
router.put('/tree/:id/rename', requireTenantAdmin, renameNode);
router.put('/tree/:id/move', requireTenantAdmin, moveNode);
router.delete('/tree/:id', requireTenantAdmin, deleteNode);

export default router;
