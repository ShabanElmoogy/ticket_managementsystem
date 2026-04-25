import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { createTemplateSchema, updateTemplateSchema, applyTemplateSchema } from './epicTemplates.validation.js';
import { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, applyTemplate } from './epicTemplates.controller.js';

const router = express.Router();

router.use(authenticateToken);

// ── Static routes — must be before /:id ──────────────────────────────────────

router.post('/apply/:epicId', requireTenantScopeMiddleware, requireTenantAdmin, validate(applyTemplateSchema), applyTemplate);

// ── Template CRUD ─────────────────────────────────────────────────────────────

router.get('/',    enforceTenantScope, listTemplates);
router.post('/',   requireTenantScopeMiddleware, requireTenantAdmin, validate(createTemplateSchema), createTemplate);

router.get('/:id',    getTemplate);
router.put('/:id',    requireTenantAdmin, validate(updateTemplateSchema), updateTemplate);
router.delete('/:id', requireTenantAdmin, deleteTemplate);

export default router;
