/**
 * epicWatchers/epicWatchers.routes.js
 * Watch / unwatch an epic and list its watchers.
 * Mounted at /epics by the top-level router.
 */

import express from 'express';
import { getEpicWatchers, watchEpic, unwatchEpic } from './epicWatchers.controller.js';

const router = express.Router();

/**
 * @swagger
 * /epics/{id}/watchers:
 *   get:
 *     tags: [Epics]
 *     summary: List watchers of an epic
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Watcher list
 */
router.get('/:id/watchers', getEpicWatchers);

/**
 * @swagger
 * /epics/{id}/watch:
 *   post:
 *     tags: [Epics]
 *     summary: Watch an epic (current user)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: '{ watching: true }'
 *   delete:
 *     tags: [Epics]
 *     summary: Unwatch an epic (current user)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: '{ watching: false }'
 */
router.post('/:id/watch',   watchEpic);
router.delete('/:id/watch', unwatchEpic);

export default router;
