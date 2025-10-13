import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  moveTask
} from '../controllers/taskController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/tasks - Get all tasks (with optional boardId filter)
router.get('/', getTasks);

// GET /api/tasks/:id - Get a specific task
router.get('/:id', getTask);

// POST /api/tasks - Create a new task
router.post('/', createTask);

// PUT /api/tasks/:id - Update a task
router.put('/:id', updateTask);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', deleteTask);

// PUT /api/tasks/:id/move - Move a task to different column/position
router.put('/:id/move', moveTask);

export default router;