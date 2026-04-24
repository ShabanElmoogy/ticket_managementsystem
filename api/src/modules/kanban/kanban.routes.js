import express from 'express';
import * as kanbanController from './kanban.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import {
  createBoardSchema, updateBoardSchema,
  addColumnSchema, updateColumnSchema,
  moveTicketSchema, moveTaskSchema,
} from './kanban.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Kanban
 *   description: Kanban boards, columns, and item movement
 */

// ── Boards ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /kanban/boards:
 *   get:
 *     tags: [Kanban]
 *     summary: List all active boards (tenant-scoped)
 *     responses:
 *       200:
 *         $ref: '#/components/responses/BoardList'
 *   post:
 *     tags: [Kanban]
 *     summary: Create a board
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string, maxLength: 150 }
 *               description: { type: string, nullable: true }
 *               type:        { type: string, enum: [TICKETS, TASKS] }
 *               isDefault:   { type: boolean }
 *               columns:     { type: array }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Board'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/boards',  authenticateToken, enforceTenantScope, kanbanController.getAllBoards);
router.post('/boards', authenticateToken, requireTenantScopeMiddleware, validate(createBoardSchema), kanbanController.createBoard);

/**
 * @swagger
 * /kanban/boards/{id}:
 *   get:
 *     tags: [Kanban]
 *     summary: Get board by ID with columns, permissions, and items
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Board'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Kanban]
 *     summary: Update a board (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Board'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Kanban]
 *     summary: Delete a board (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/boards/:id',    authenticateToken, enforceTenantScope, kanbanController.getBoardById);
router.put('/boards/:id',    authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(updateBoardSchema), kanbanController.updateBoard);
router.delete('/boards/:id', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, kanbanController.deleteBoard);

/**
 * @swagger
 * /kanban/boards/{boardId}/analytics:
 *   get:
 *     tags: [Kanban]
 *     summary: Get ticket and task counts for a board
 *     parameters:
 *       - name: boardId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: '{ ticketCount: number, taskCount: number }'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/boards/:boardId/analytics', authenticateToken, enforceTenantScope, kanbanController.getBoardAnalytics);

// ── Columns ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /kanban/boards/{boardId}/columns:
 *   post:
 *     tags: [Kanban]
 *     summary: Add a column to a board (TENANT_ADMIN)
 *     parameters:
 *       - name: boardId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string, maxLength: 100 }
 *               description: { type: string, nullable: true }
 *               color:       { type: string }
 *               position:    { type: integer, minimum: 0 }
 *               wipLimit:    { type: integer, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Column'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/boards/:boardId/columns', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(addColumnSchema), kanbanController.addColumn);

/**
 * @swagger
 * /kanban/columns/{columnId}:
 *   put:
 *     tags: [Kanban]
 *     summary: Update a column (TENANT_ADMIN)
 *     parameters:
 *       - name: columnId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Column'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Kanban]
 *     summary: Delete a column (TENANT_ADMIN)
 *     parameters:
 *       - name: columnId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/columns/:columnId',    authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(updateColumnSchema), kanbanController.updateColumn);
router.delete('/columns/:columnId', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, kanbanController.deleteColumn);

// ── Move operations ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /kanban/tickets/{ticketId}/move:
 *   put:
 *     tags: [Kanban]
 *     summary: Move a ticket to a different status / board position
 *     parameters:
 *       - name: ticketId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newStatus:   { type: string }
 *               newPosition: { type: integer, minimum: 0 }
 *               boardId:     { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated ticket
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/tickets/:ticketId/move', authenticateToken, enforceTenantScope, validate(moveTicketSchema), kanbanController.moveTicket);

/**
 * @swagger
 * /kanban/tasks/{taskId}/move:
 *   put:
 *     tags: [Kanban]
 *     summary: Move a task to a different column / position
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [columnId, position]
 *             properties:
 *               columnId: { type: string, format: uuid }
 *               position: { type: integer, minimum: 0 }
 *     responses:
 *       200:
 *         description: '{ message: Task moved successfully }'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/tasks/:taskId/move', authenticateToken, enforceTenantScope, validate(moveTaskSchema), kanbanController.moveTask);

export default router;
