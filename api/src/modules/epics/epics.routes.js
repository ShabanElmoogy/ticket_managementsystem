/**
 * epics.routes.js
 * Top-level router — composes all epic sub-module routers.
 * Mounted at /api/epics by modules/routes.js.
 *
 * Sub-routers:
 *   epics/epics.routes.js           — CRUD, features, blockers, tickets, relations, graph, burndown
 *   epicComments/epicComments.routes.js
 *   epicActivity/epicActivity.routes.js
 *   epicWatchers/epicWatchers.routes.js
 *   epicContributors/epicContributors.routes.js
 */

import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';

import epicsRouter        from './epics/epics.routes.js';
import commentsRouter     from './epicComments/epicComments.routes.js';
import activityRouter     from './epicActivity/epicActivity.routes.js';
import watchersRouter     from './epicWatchers/epicWatchers.routes.js';
import contributorsRouter from './epicContributors/epicContributors.routes.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Epics
 *   description: Epic management — hierarchy, features, dependencies, relations
 */

// Auth applies to every epic route
router.use(authenticateToken);

// Mount all sub-routers at the same path prefix —
// each sub-router owns its own path segments (/:id/comments, etc.)
router.use('/', epicsRouter);
router.use('/', commentsRouter);
router.use('/', activityRouter);
router.use('/', watchersRouter);
router.use('/', contributorsRouter);

export default router;
