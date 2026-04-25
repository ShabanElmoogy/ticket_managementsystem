/**
 * watchers/watchers.routes.js
 * Watcher routes for tickets.
 * Mounted at /tickets by the top-level tickets router.
 */

import express from 'express';
import { getWatchers, watchTicket, unwatchTicket } from './watchers.controller.js';

const router = express.Router();

router.get('/:id/watchers', getWatchers);
router.post('/:id/watch',   watchTicket);
router.delete('/:id/watch', unwatchTicket);

export default router;
