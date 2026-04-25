/** @file Swagger/OpenAPI documentation for EpicWatchers routes. */

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
