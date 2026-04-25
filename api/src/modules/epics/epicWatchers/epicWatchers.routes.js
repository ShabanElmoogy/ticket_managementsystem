/**
 * epicWatchers/epicWatchers.routes.js
 * Watch / unwatch an epic and list its watchers.
 * Mounted at /epics by the top-level router.
 */

import express from 'express';
import { getEpicWatchers, watchEpic, unwatchEpic } from './epicWatchers.controller.js';

const router = express.Router();

router.get('/:id/watchers', getEpicWatchers);

router.post('/:id/watch',   watchEpic);
router.delete('/:id/watch', unwatchEpic);

export default router;
