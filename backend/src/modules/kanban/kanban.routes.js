import express from 'express';
import * as kanbanController from './kanban.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Board Routes
router.get('/boards', authenticateToken, kanbanController.getAllBoards);
router.get('/boards/:id', authenticateToken, kanbanController.getBoardById);
router.post('/boards', authenticateToken, kanbanController.createBoard);
router.put('/boards/:id', authenticateToken, requireTenantAdmin, kanbanController.updateBoard);
router.delete('/boards/:id', authenticateToken, requireTenantAdmin, kanbanController.deleteBoard);

// Test endpoint for debugging auth
router.get('/test-auth', authenticateToken, (req, res) => {
  res.json({ message: 'Auth working', user: req.user });
});

// Ticket Movement (temporarily without auth for debugging)
router.put('/tickets/:ticketId/move', authenticateToken, kanbanController.moveTicket);

// Task Movement
router.put('/tasks/:taskId/move', kanbanController.moveTask);

// Column Management
router.post('/boards/:boardId/columns', authenticateToken, requireTenantAdmin, kanbanController.addColumn);
router.put('/columns/:columnId', authenticateToken, requireTenantAdmin, kanbanController.updateColumn);
router.delete('/columns/:columnId', authenticateToken, requireTenantAdmin, kanbanController.deleteColumn);

// Analytics
router.get('/boards/:boardId/analytics', authenticateToken, kanbanController.getBoardAnalytics);

export default router;
