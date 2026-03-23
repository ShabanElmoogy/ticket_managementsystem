import express from 'express';
import * as tasksController from './tasks.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { createTaskSchema, updateTaskSchema, moveTaskSchema } from './tasks.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Kanban tasks
 */

router.use(authenticateToken);
router.use(resolveTenant);

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks (optionally filtered by boardId)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: query
 *         name: boardId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Array of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:       { type: string }
 *               description: { type: string }
 *               boardId:     { type: string, format: uuid }
 *               columnId:    { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Created task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
router.get('/', tasksController.getTasks);
router.post('/', requireTenantAdmin, validate(createTaskSchema), tasksController.createTask);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task (TENANT_ADMIN)
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
 *               title:       { type: string }
 *               description: { type: string }
 *               status:      { type: string }
 *     responses:
 *       200:
 *         description: Updated task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task (TENANT_ADMIN)
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
router.get('/:id', tasksController.getTask);
router.put('/:id', requireTenantAdmin, validate(updateTaskSchema), tasksController.updateTask);
router.delete('/:id', requireTenantAdmin, tasksController.deleteTask);

/**
 * @swagger
 * /tasks/{id}/move:
 *   put:
 *     tags: [Tasks]
 *     summary: Move a task to a different column / position
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
 *               columnId: { type: string, format: uuid }
 *               position: { type: integer }
 *     responses:
 *       200:
 *         description: Moved
 */
router.put('/:id/move', validate(moveTaskSchema), tasksController.moveTask);

export default router;
