/** @file Swagger/OpenAPI documentation for Comments routes. */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Ticket comments
 */

/**
 * @swagger
 * /tickets/{id}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment to a ticket
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateComment'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Comment'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /tickets/{id}/comments/{commentId}:
 *   delete:
 *     tags: [Comments]
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
