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

router.get('/:id/activity', validate(activityQuerySchema, 'query'), listEpicActivity);

export default router;
