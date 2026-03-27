import express from 'express';
import * as kanbanController from './kanban.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createBoardSchema, updateBoardSchema, addColumnSchema, updateColumnSchema, moveTicketSchema, moveTaskSchema } from './kanban.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Kanban
 *   description: Kanban boards and columns
 */

/**
 * @swagger
 * /kanban/boards:
 *   get:
 *     tags: [Kanban]
 *     summary: List all boards
 *     responses:
 *       200:
 *         $ref: '#/components/responses/BoardList'
 *   post:
 *     tags: [Kanban]
 *     summary: Create a board
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateBoard'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Board'
 */
router.get('/boards', authenticateToken, kanbanController.getAllBoards);
router.post('/boards', authenticateToken, validate(createBoardSchema), kanbanController.createBoard);

/**
 * @swagger
 * /kanban/boards/{id}:
 *   get:
 *     tags: [Kanban]
 *     summary: Get board by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Board'
 *   put:
 *     tags: [Kanban]
 *     summary: Update a board (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateBoard'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Board'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
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
router.get('/boards/:id', authenticateToken, kanbanController.getBoardById);
router.put('/boards/:id', authenticateToken, requireTenantAdmin, validate(updateBoardSchema), kanbanController.updateBoard);
router.delete('/boards/:id', authenticateToken, requireTenantAdmin, kanbanController.deleteBoard);

/**
 * @swagger
 * /kanban/boards/{boardId}/analytics:
 *   get:
 *     tags: [Kanban]
 *     summary: Get board analytics
 *     parameters:
 *       - $ref: '#/components/parameters/PathBoardId'
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get('/boards/:boardId/analytics', authenticateToken, kanbanController.getBoardAnalytics);

/**
 * @swagger
 * /kanban/boards/{boardId}/columns:
 *   post:
 *     tags: [Kanban]
 *     summary: Add a column to a board (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathBoardId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/AddColumn'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Column'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/boards/:boardId/columns', authenticateToken, requireTenantAdmin, validate(addColumnSchema), kanbanController.addColumn);

/**
 * @swagger
 * /kanban/columns/{columnId}:
 *   put:
 *     tags: [Kanban]
 *     summary: Update a column (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathColumnId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateColumn'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Column'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Kanban]
 *     summary: Delete a column (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathColumnId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/columns/:columnId', authenticateToken, requireTenantAdmin, validate(updateColumnSchema), kanbanController.updateColumn);
router.delete('/columns/:columnId', authenticateToken, requireTenantAdmin, kanbanController.deleteColumn);

/**
 * @swagger
 * /kanban/tickets/{ticketId}/move:
 *   put:
 *     tags: [Kanban]
 *     summary: Move a ticket to a different column
 *     parameters:
 *       - $ref: '#/components/parameters/PathTicketId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/MoveItem'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
router.put('/tickets/:ticketId/move', authenticateToken, validate(moveTicketSchema), kanbanController.moveTicket);

/**
 * @swagger
 * /kanban/tasks/{taskId}/move:
 *   put:
 *     tags: [Kanban]
 *     summary: Move a task to a different column
 *     parameters:
 *       - $ref: '#/components/parameters/PathTaskId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/MoveItem'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
router.put('/tasks/:taskId/move', validate(moveTaskSchema), kanbanController.moveTask);

export default router;
