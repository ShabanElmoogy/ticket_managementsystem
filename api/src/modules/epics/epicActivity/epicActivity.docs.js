/** @file Swagger/OpenAPI documentation for EpicActivity routes. */

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
