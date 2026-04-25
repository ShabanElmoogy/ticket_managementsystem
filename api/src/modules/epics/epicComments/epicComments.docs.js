/** @file Swagger/OpenAPI documentation for EpicComments routes. */

/**
 * @swagger
 * /epics/{id}/comments:
 *   get:
 *     tags: [Epics]
 *     summary: List comments on an epic
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Comment list
 *   post:
 *     tags: [Epics]
 *     summary: Add a comment to an epic
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       201:
 *         description: Created comment
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /epics/{id}/comments/{commentId}:
 *   delete:
 *     tags: [Epics]
 *     summary: Delete a comment (author or admin)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
