import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from './templates.controller.js';

const router = express.Router();
router.use(authenticateToken, resolveTenant);

router.get('/',       listTemplates);
router.post('/',      requireTenantAdmin, createTemplate);
router.put('/:id',    requireTenantAdmin, updateTemplate);
router.delete('/:id', requireTenantAdmin, deleteTemplate);

export default router;
