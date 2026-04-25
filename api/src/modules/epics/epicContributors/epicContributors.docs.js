/** @file Swagger/OpenAPI documentation for EpicContributors routes. */

/**
 * @swagger
 * /epics/{id}/contributors:
 *   get:
 *     tags: [Epics]
 *     summary: List contributors on an epic
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Contributor list
 *   post:
 *     tags: [Epics]
 *     summary: Add a contributor (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       201:
 *         description: Contributor added
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /epics/{id}/contributors/{contributorId}:
 *   put:
 *     tags: [Epics]
 *     summary: Update contributor role (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: contributorId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated contributor
 *   delete:
 *     tags: [Epics]
 *     summary: Remove a contributor (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: contributorId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Removed
 */
