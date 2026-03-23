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
 *         description: Array of boards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Board'
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
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Created board
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Board with columns
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 *   put:
 *     tags: [Kanban]
 *     summary: Update a board (TENANT_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Updated board
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 *   delete:
 *     tags: [Kanban]
 *     summary: Delete a board (TENANT_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
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
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:     { type: string }
 *               position: { type: integer }
 *     responses:
 *       201:
 *         description: Created column
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Column'
 */
router.post('/boards/:boardId/columns', authenticateToken, requireTenantAdmin, validate(addColumnSchema), kanbanController.addColumn);

/**
 * @swagger
 * /kanban/columns/{columnId}:
 *   put:
 *     tags: [Kanban]
 *     summary: Update a column (TENANT_ADMIN)
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:     { type: string }
 *               position: { type: integer }
 *     responses:
 *       200:
 *         description: Updated column
 *   delete:
 *     tags: [Kanban]
 *     summary: Delete a column (TENANT_ADMIN)
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
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
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               columnId: { type: string, format: uuid }
 *               position: { type: integer }
 *     responses:
 *       200:
 *         description: Moved
 */
router.put('/tickets/:ticketId/move', authenticateToken, validate(moveTicketSchema), kanbanController.moveTicket);

/**
 * @swagger
 * /kanban/tasks/{taskId}/move:
 *   put:
 *     tags: [Kanban]
 *     summary: Move a task to a different column
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               columnId: { type: string, format: uuid }
 *               position: { type: integer }
 *     responses:
 *       200:
 *         description: Moved
 */
router.put('/tasks/:taskId/move', validate(moveTaskSchema), kanbanController.moveTask);

export default router;
