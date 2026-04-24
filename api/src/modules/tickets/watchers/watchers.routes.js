/**
 * watchers/watchers.routes.js
 * Watcher routes for tickets.
 * Mounted at /tickets by the top-level tickets router.
 * Routes use /:id/watchers and /:id/watch prefixes.
 */

import express from 'express';
import { getWatchers, watchTicket, unwatchTicket } from './watchers.controller.js';

const router = express.Router();

/**
 * @swagger
 * /tickets/{id}/watchers:
 *   get:
 *     tags: [Tickets]
 *     summary: List watchers of a ticket
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Watcher list
 */
router.get('/:id/watchers', getWatchers);

/**
 * @swagger
 * /tickets/{id}/watch:
 *   post:
 *     tags: [Tickets]
 *     summary: Watch a ticket (current user)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: '{ watching: true }'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Tickets]
 *     summary: Unwatch a ticket (current user)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: '{ watching: false }'
 */
router.post('/:id/watch',   watchTicket);
router.delete('/:id/watch', unwatchTicket);

export default router;
