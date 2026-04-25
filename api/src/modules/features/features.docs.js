/** @file Swagger/OpenAPI documentation for Features routes. */

/**
 * @swagger
 * tags:
 *   name: Features
 *   description: Feature requests with voting and implementation steps
 */

/**
 * @swagger
 * /features:
 *   get:
 *     tags: [Features]
 *     summary: List feature requests (tenant-scoped, with vote counts)
 *     responses:
 *       200:
 *         description: Feature list
 *   post:
 *     tags: [Features]
 *     summary: Submit a feature request
 *     responses:
 *       201:
 *         description: Created feature
 */

/**
 * @swagger
 * /features/{id}:
 *   get:
 *     tags: [Features]
 *     summary: Get a feature request by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Feature with vote count
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Features]
 *     summary: Update a feature request (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Updated feature
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Features]
 *     summary: Delete a feature request (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /features/{id}/vote:
 *   post:
 *     tags: [Features]
 *     summary: Toggle vote on a feature request
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: '{ voteCount: number, votedByMe: boolean }'
 */

/**
 * @swagger
 * /features/{id}/steps:
 *   get:
 *     tags: [Features]
 *     summary: List implementation steps for a feature
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Step list
 *   post:
 *     tags: [Features]
 *     summary: Add an implementation step
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       201:
 *         description: Created step
 */

/**
 * @swagger
 * /features/{id}/steps/{stepId}:
 *   put:
 *     tags: [Features]
 *     summary: Update a step (triggers auto-promotion when all steps DONE)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: stepId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated step
 *   delete:
 *     tags: [Features]
 *     summary: Delete a step
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: stepId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */
