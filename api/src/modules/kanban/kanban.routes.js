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

router.get('/boards',  authenticateToken, enforceTenantScope, kanbanController.getAllBoards);
router.post('/boards', authenticateToken, requireTenantScopeMiddleware, validate(createBoardSchema), kanbanController.createBoard);

router.get('/boards/:id',    authenticateToken, enforceTenantScope, kanbanController.getBoardById);
router.put('/boards/:id',    authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(updateBoardSchema), kanbanController.updateBoard);
router.delete('/boards/:id', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, kanbanController.deleteBoard);

router.get('/boards/:boardId/analytics', authenticateToken, enforceTenantScope, kanbanController.getBoardAnalytics);

// ── Columns ───────────────────────────────────────────────────────────────────

router.post('/boards/:boardId/columns', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(addColumnSchema), kanbanController.addColumn);

router.put('/columns/:columnId',    authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(updateColumnSchema), kanbanController.updateColumn);
router.delete('/columns/:columnId', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, kanbanController.deleteColumn);

// ── Move operations ───────────────────────────────────────────────────────────

router.put('/tickets/:ticketId/move', authenticateToken, enforceTenantScope, validate(moveTicketSchema), kanbanController.moveTicket);

router.put('/tasks/:taskId/move', authenticateToken, enforceTenantScope, validate(moveTaskSchema), kanbanController.moveTask);

export default router;
