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
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TaskList'
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateTask'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Task'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
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
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Task'
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateTask'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Task'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
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
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/MoveItem'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
router.put('/:id/move', validate(moveTaskSchema), tasksController.moveTask);

export default router;
