import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { listEpics, getEpic, createEpic, updateEpic, deleteEpic, linkFeature, unlinkFeature } from './epics.controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/',    listEpics);
router.get('/:id', getEpic);
router.post('/',   requireTenantAdmin, createEpic);
router.put('/:id', requireTenantAdmin, updateEpic);
router.delete('/:id', requireTenantAdmin, deleteEpic);

// Feature linking
router.post('/:id/features',           requireTenantAdmin, linkFeature);
router.delete('/:id/features/:featureId', requireTenantAdmin, unlinkFeature);

export default router;
