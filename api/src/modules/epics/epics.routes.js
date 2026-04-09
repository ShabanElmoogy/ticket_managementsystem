import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { listEpics, getEpic, createEpic, updateEpic, deleteEpic, linkFeature, unlinkFeature, reorderFeatures, bulkUpdateStatus } from './epics.controller.js';
import { listEpicComments, createEpicComment, deleteEpicComment } from './epicComments.controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/',    listEpics);
router.get('/:id', getEpic);
router.post('/',   requireTenantAdmin, createEpic);
router.put('/bulk-status',              requireTenantAdmin, bulkUpdateStatus);
router.put('/:id/features/reorder',     requireTenantAdmin, reorderFeatures);
router.put('/:id',                      requireTenantAdmin, updateEpic);
router.delete('/:id',                   requireTenantAdmin, deleteEpic);

// Feature linking
router.post('/:id/features',                  requireTenantAdmin, linkFeature);
router.delete('/:id/features/:featureId',     requireTenantAdmin, unlinkFeature);

// Comments
router.get('/:id/comments',                   listEpicComments);
router.post('/:id/comments',                  createEpicComment);
router.delete('/:id/comments/:commentId',     deleteEpicComment);

export default router;
