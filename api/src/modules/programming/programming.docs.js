/** @file Swagger/OpenAPI documentation for Programming routes. */

/**
 * @swagger
 * tags:
 *   name: Programming
 *   description: Programming details and programmer assignment for tickets
 */

/**
 * @swagger
 * /tickets/{id}/programming:
 *   get:
 *     tags: [Programming]
 *     summary: Get programming details for a ticket (PROGRAMMER or ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Programming details or null
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   put:
 *     tags: [Programming]
 *     summary: Upsert programming details for a ticket (PROGRAMMER or ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Saved programming details
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /tickets/{id}/assign-programmer:
 *   post:
 *     tags: [Programming]
 *     summary: Assign a programmer to a ticket (ADMIN only)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [programmerId]
 *             properties:
 *               programmerId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated ticket
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
