import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, applyTemplate } from './epicTemplates.controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/',    listTemplates);
router.get('/:id', getTemplate);
router.post('/',   requireTenantAdmin, createTemplate);
router.put('/:id', requireTenantAdmin, updateTemplate);
router.delete('/:id', requireTenantAdmin, deleteTemplate);

// Apply template to an epic
router.post('/apply/:epicId', requireTenantAdmin, applyTemplate);

export default router;
