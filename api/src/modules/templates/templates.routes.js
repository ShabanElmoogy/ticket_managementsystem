import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { createTemplateSchema, updateTemplateSchema } from './templates.validation.js';
import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from './templates.controller.js';

const router = express.Router();

router.get('/',  authenticateToken, enforceTenantScope, listTemplates);
router.post('/', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(createTemplateSchema), createTemplate);

router.put('/:id',    authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(updateTemplateSchema), updateTemplate);
router.delete('/:id', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, deleteTemplate);

export default router;
