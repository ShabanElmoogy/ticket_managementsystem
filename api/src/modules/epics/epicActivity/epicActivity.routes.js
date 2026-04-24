/**
 * epicActivity/epicActivity.routes.js
 * Activity feed for an epic.
 * Mounted at /epics by the top-level router.
 */

import express from 'express';
import { validate } from '../../../middleware/validate.js';
import { activityQuerySchema } from './epicActivity.validation.js';
import { listEpicActivity } from './epicActivity.controller.js';

const router = express.Router();

/**
 * @swagger
 * /epics/{id}/activity:
 *   get:
 *     tags: [Epics]
 *     summary: List recent activity for an epic
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 200, default: 50 }
 *     responses:
 *       200:
 *         description: Activity list
 */
router.get('/:id/activity', validate(activityQuerySchema, 'query'), listEpicActivity);

export default router;
