import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { listDocs, getDoc, createDoc, updateDoc, deleteDoc, listTree, createFolder, createDocNode, renameNode, moveNode, deleteNode } from './docs.controller.js';
import { validate } from '../../middleware/validate.js';
import { createDocSchema, updateDocSchema, createFolderSchema, createDocNodeSchema, renameNodeSchema, moveNodeSchema } from './docs.validation.js';

const router = express.Router();

// Apply authentication middleware to all routes (same pattern as tasks)
router.use(authenticateToken);

// Reads
router.get('/', listDocs);
router.get('/tree', listTree);
router.get('/tree/list', listTree);
router.get('/:id', getDoc);

// Writes (tenant admins only)
router.post('/', requireTenantAdmin, validate(createDocSchema), createDoc);
router.put('/:id', requireTenantAdmin, validate(updateDocSchema), updateDoc);
router.delete('/:id', requireTenantAdmin, deleteDoc);

router.post('/tree/folder', requireTenantAdmin, validate(createFolderSchema), createFolder);
router.post('/tree/doc', requireTenantAdmin, validate(createDocNodeSchema), createDocNode);
router.put('/tree/:id/rename', requireTenantAdmin, validate(renameNodeSchema), renameNode);
router.put('/tree/:id/move', requireTenantAdmin, validate(moveNodeSchema), moveNode);
router.delete('/tree/:id', requireTenantAdmin, deleteNode);

export default router;
