import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { listEpics, getEpic, createEpic, updateEpic, deleteEpic, linkFeature, unlinkFeature, reorderFeatures, bulkUpdateStatus, addBlocker, removeBlocker, listLinkedTickets, linkTicket, unlinkTicket, checkAutoClose, listSubEpics, listRelations, addRelation, removeRelation, getNetworkGraph, getEpicBurndown } from './epics/epics.controller.js';
import { listEpicComments, createEpicComment, deleteEpicComment } from './epicComments/epicComments.controller.js';
import { listEpicActivity } from './epicActivity/epicActivity.controller.js';
import { getEpicWatchers, watchEpic, unwatchEpic } from './epicWatchers/epicWatchers.controller.js';
import { listContributors, addContributor, updateContributor, removeContributor } from './epicContributors/epicContributors.controller.js';

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

// Linked tickets
router.get('/:id/tickets',              listLinkedTickets);
router.post('/:id/tickets',             requireTenantAdmin, linkTicket);
router.delete('/:id/tickets/:ticketId', requireTenantAdmin, unlinkTicket);

// Sub-epics
router.get('/:id/sub-epics', listSubEpics);

// Relations (soft links)
router.get('/:id/relations',                requireTenantAdmin, listRelations);
router.post('/:id/relations',               requireTenantAdmin, addRelation);
router.delete('/:id/relations/:relationId', requireTenantAdmin, removeRelation);

// Network graph
router.get('/network/graph', getNetworkGraph);

// Auto-close check
router.get('/:id/auto-close', checkAutoClose);

// Burndown chart data
router.get('/:id/burndown', getEpicBurndown);

// Contributors
router.get('/:id/contributors',                        listContributors);
router.post('/:id/contributors',                       requireTenantAdmin, addContributor);
router.put('/:id/contributors/:contributorId',         requireTenantAdmin, updateContributor);
router.delete('/:id/contributors/:contributorId',      requireTenantAdmin, removeContributor);

export default router;
