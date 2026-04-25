/** @file Swagger/OpenAPI documentation for watchers routes. */

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
