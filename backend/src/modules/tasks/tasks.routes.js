import express from 'express';
import * as tasksController from './tasks.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
// Resolve tenant context from headers/params (X-Tenant-Slug / X-Tenant-Id)
router.use(resolveTenant);

// GET /api/tasks - Get all tasks (with optional boardId filter)
router.get('/', tasksController.getTasks);

// GET /api/tasks/:id - Get a specific task
router.get('/:id', tasksController.getTask);

// POST /api/tasks - Create a new task
router.post('/', requireTenantAdmin, tasksController.createTask);

// PUT /api/tasks/:id - Update a task
router.put('/:id', requireTenantAdmin, tasksController.updateTask);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', requireTenantAdmin, tasksController.deleteTask);

// PUT /api/tasks/:id/move - Move a task to different column/position
router.put('/:id/move', tasksController.moveTask);

export default router;
