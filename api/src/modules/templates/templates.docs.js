/** @file Swagger/OpenAPI documentation for Templates routes. */

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: Ticket templates (global + tenant-scoped)
 */

/**
 * @swagger
 * /templates:
 *   get:
 *     tags: [Templates]
 *     summary: List templates visible to the caller
 *     responses:
 *       200:
 *         description: Template list
 *   post:
 *     tags: [Templates]
 *     summary: Create a template (TENANT_ADMIN)
 *     responses:
 *       201:
 *         description: Created template
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /templates/{id}:
 *   put:
 *     tags: [Templates]
 *     summary: Update a template (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Updated template
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Templates]
 *     summary: Delete a template (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
