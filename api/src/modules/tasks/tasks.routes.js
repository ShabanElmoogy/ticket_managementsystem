import express from 'express';
import * as tasksController from './tasks.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { createTaskSchema, updateTaskSchema, moveTaskSchema } from './tasks.validation.js';

const router = express.Router();

router.get('/', enforceTenantScope, tasksController.getTasks);
router.post('/', requireTenantScopeMiddleware, requireTenantAdmin, validate(createTaskSchema), tasksController.createTask);

router.get('/:id', enforceTenantScope, tasksController.getTask);
router.put('/:id', requireTenantScopeMiddleware, requireTenantAdmin, validate(updateTaskSchema), tasksController.updateTask);
router.delete('/:id', requireTenantScopeMiddleware, requireTenantAdmin, tasksController.deleteTask);

router.put('/:id/move', enforceTenantScope, validate(moveTaskSchema), tasksController.moveTask);

export default router;
