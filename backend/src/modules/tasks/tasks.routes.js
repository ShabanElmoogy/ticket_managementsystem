import express from 'express';
import * as tasksController from './tasks.controller.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/tasks - Get all tasks (with optional boardId filter)
router.get('/', tasksController.getTasks);

// GET /api/tasks/:id - Get a specific task
router.get('/:id', tasksController.getTask);

// POST /api/tasks - Create a new task
router.post('/', tasksController.createTask);

// PUT /api/tasks/:id - Update a task
router.put('/:id', tasksController.updateTask);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', tasksController.deleteTask);

// PUT /api/tasks/:id/move - Move a task to different column/position
router.put('/:id/move', tasksController.moveTask);

export default router;