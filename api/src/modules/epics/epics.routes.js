import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { listEpics, getEpic, createEpic, updateEpic, deleteEpic, linkFeature, unlinkFeature, reorderFeatures, bulkUpdateStatus, addBlocker, removeBlocker } from './epics/epics.controller.js';
import { listEpicComments, createEpicComment, deleteEpicComment } from './epicComments/epicComments.controller.js';
import { listEpicActivity } from './epicActivity/epicActivity.controller.js';
import { getEpicWatchers, watchEpic, unwatchEpic } from './epicWatchers/epicWatchers.controller.js';

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
router.post('/:id/features',              requireTenantAdmin, linkFeature);
router.delete('/:id/features/:featureId', requireTenantAdmin, unlinkFeature);

// Dependencies
router.post('/:id/blockers',                requireTenantAdmin, addBlocker);
router.delete('/:id/blockers/:blockerId',   requireTenantAdmin, removeBlocker);

// Comments
router.get('/:id/comments',               listEpicComments);
router.post('/:id/comments',              createEpicComment);
router.delete('/:id/comments/:commentId', deleteEpicComment);

// Activity
router.get('/:id/activity', listEpicActivity);

// Watchers
router.get('/:id/watchers',  getEpicWatchers);
router.post('/:id/watch',    watchEpic);
router.delete('/:id/watch',  unwatchEpic);

export default router;
