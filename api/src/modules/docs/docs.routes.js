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

/**
 * @swagger
 * tags:
 *   name: Docs
 *   description: Document editor — docs and tree nodes
 */

router.use(authenticateToken);

// ── Static tree routes — must be before /:id ──────────────────────────────────

/**
 * @swagger
 * /documents/tree:
 *   get:
 *     tags: [Docs]
 *     summary: List all tree nodes (flat array, frontend builds the tree)
 *     responses:
 *       200:
 *         description: Node list
 */
router.get('/tree',      enforceTenantScope, listTree);
router.get('/tree/list', enforceTenantScope, listTree);

/**
 * @swagger
 * /documents/tree/folder:
 *   post:
 *     tags: [Docs]
 *     summary: Create a folder node (TENANT_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:    { type: string }
 *               parentId: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Created folder node
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/tree/folder', requireTenantScopeMiddleware, requireTenantAdmin, validate(createFolderSchema), createFolder);

/**
 * @swagger
 * /documents/tree/doc:
 *   post:
 *     tags: [Docs]
 *     summary: Create a doc node (TENANT_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:    { type: string }
 *               parentId: { type: string, nullable: true }
 *               docId:    { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Created doc node
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/tree/doc', requireTenantScopeMiddleware, requireTenantAdmin, validate(createDocNodeSchema), createDocNode);

/**
 * @swagger
 * /documents/tree/{id}/rename:
 *   put:
 *     tags: [Docs]
 *     summary: Rename a tree node (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *     responses:
 *       200:
 *         description: Updated node
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/tree/:id/rename', requireTenantScopeMiddleware, requireTenantAdmin, validate(renameNodeSchema), renameNode);

/**
 * @swagger
 * /documents/tree/{id}/move:
 *   put:
 *     tags: [Docs]
 *     summary: Move a tree node to a new parent / position (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPosition]
 *             properties:
 *               newParentId: { type: string, nullable: true }
 *               newPosition: { type: integer, minimum: 0 }
 *     responses:
 *       200:
 *         description: Updated node
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/tree/:id/move', requireTenantScopeMiddleware, requireTenantAdmin, validate(moveNodeSchema), moveNode);

/**
 * @swagger
 * /documents/tree/{id}:
 *   delete:
 *     tags: [Docs]
 *     summary: Delete a tree node and its subtree (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       204:
 *         description: Deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/tree/:id', requireTenantScopeMiddleware, requireTenantAdmin, deleteNode);

// ── Doc CRUD — parameterised routes last ──────────────────────────────────────

/**
 * @swagger
 * /documents:
 *   get:
 *     tags: [Docs]
 *     summary: List all docs
 *     responses:
 *       200:
 *         description: Doc list
 *   post:
 *     tags: [Docs]
 *     summary: Create a doc (TENANT_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:  { type: string }
 *               blocks: { type: array }
 *     responses:
 *       201:
 *         description: Created doc
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/',  enforceTenantScope, listDocs);
router.post('/', requireTenantScopeMiddleware, requireTenantAdmin, validate(createDocSchema), createDoc);

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     tags: [Docs]
 *     summary: Get a doc by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Doc
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Docs]
 *     summary: Upsert a doc (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:  { type: string }
 *               blocks: { type: array }
 *     responses:
 *       200:
 *         description: Updated doc
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Docs]
 *     summary: Delete a doc (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       204:
 *         description: Deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id',    enforceTenantScope, getDoc);
router.put('/:id',    requireTenantScopeMiddleware, requireTenantAdmin, validate(updateDocSchema), updateDoc);
router.delete('/:id', requireTenantScopeMiddleware, requireTenantAdmin, deleteDoc);

export default router;
