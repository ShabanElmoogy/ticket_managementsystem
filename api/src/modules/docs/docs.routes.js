import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import {
  createDocSchema, updateDocSchema,
  createFolderSchema, createDocNodeSchema, renameNodeSchema, moveNodeSchema,
} from './docs.validation.js';
import {
  listDocs, getDoc, createDoc, updateDoc, deleteDoc,
  listTree, createFolder, createDocNode, renameNode, moveNode, deleteNode,
} from './docs.controller.js';

const router = express.Router();

router.use(authenticateToken);

// ── Static tree routes — must be before /:id ──────────────────────────────────

router.get('/tree', enforceTenantScope, listTree);

router.post('/tree/folder', requireTenantScopeMiddleware, requireTenantAdmin, validate(createFolderSchema), createFolder);

router.post('/tree/doc', requireTenantScopeMiddleware, requireTenantAdmin, validate(createDocNodeSchema), createDocNode);

router.put('/tree/:id/rename', requireTenantScopeMiddleware, requireTenantAdmin, validate(renameNodeSchema), renameNode);

router.put('/tree/:id/move', requireTenantScopeMiddleware, requireTenantAdmin, validate(moveNodeSchema), moveNode);

router.delete('/tree/:id', requireTenantScopeMiddleware, requireTenantAdmin, deleteNode);

// ── Doc CRUD — parameterised routes last ──────────────────────────────────────

router.get('/',  enforceTenantScope, listDocs);
router.post('/', requireTenantScopeMiddleware, requireTenantAdmin, validate(createDocSchema), createDoc);

router.get('/:id',    enforceTenantScope, getDoc);
router.put('/:id',    requireTenantScopeMiddleware, requireTenantAdmin, validate(updateDocSchema), updateDoc);
router.delete('/:id', requireTenantScopeMiddleware, requireTenantAdmin, deleteDoc);

export default router;
