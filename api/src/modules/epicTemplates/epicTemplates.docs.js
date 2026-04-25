/** @file Swagger/OpenAPI documentation for EpicTemplates routes. */

/**
 * @swagger
 * tags:
 *   name: EpicTemplates
 *   description: Reusable epic templates with pre-defined features and steps
 */

/**
 * @swagger
 * /epic-templates/apply/{epicId}:
 *   post:
 *     tags: [EpicTemplates]
 *     summary: Apply a template to an existing epic (TENANT_ADMIN)
 *     parameters:
 *       - name: epicId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Features created from template
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /epic-templates:
 *   get:
 *     tags: [EpicTemplates]
 *     summary: List templates (global + tenant-own)
 *     responses:
 *       200:
 *         description: Template list
 *   post:
 *     tags: [EpicTemplates]
 *     summary: Create a template (TENANT_ADMIN)
 *     responses:
 *       201:
 *         description: Created template
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /epic-templates/{id}:
 *   get:
 *     tags: [EpicTemplates]
 *     summary: Get a template by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Template
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [EpicTemplates]
 *     summary: Update a template (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Updated template
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [EpicTemplates]
 *     summary: Delete a template (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
