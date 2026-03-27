import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from './templates.controller.js';

const router = express.Router();
router.use(resolveTenant);

router.get('/',     authenticateToken, listTemplates);
router.post('/',    authenticateToken, requireTenantAdmin, createTemplate);
router.put('/:id',  authenticateToken, requireTenantAdmin, updateTemplate);
router.delete('/:id', authenticateToken, requireTenantAdmin, deleteTemplate);

export default router;
