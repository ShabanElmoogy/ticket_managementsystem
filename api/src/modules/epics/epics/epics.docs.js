/** @file Swagger/OpenAPI documentation for Epics core routes. */

/**
 * @swagger
 * tags:
 *   name: Epics
 *   description: Epic management — hierarchy, features, dependencies, relations
 */

/**
 * @swagger
 * /epics/network/graph:
 *   get:
 *     tags: [Epics]
 *     summary: Network graph of all epics (nodes + edges)
 *     responses:
 *       200:
 *         description: Graph data
 */

/**
 * @swagger
 * /epics/bulk-status:
 *   put:
 *     tags: [Epics]
 *     summary: Bulk update epic status (TENANT_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, status]
 *             properties:
 *               ids:    { type: array, items: { type: string, format: uuid } }
 *               status: { type: string, enum: [DRAFT, ACTIVE, COMPLETED, CANCELLED] }
 *     responses:
 *       200:
 *         description: Updated count
 */

/**
 * @swagger
 * /epics:
 *   get:
 *     tags: [Epics]
 *     summary: List all epics (tenant-scoped)
 *     responses:
 *       200:
 *         description: Epic list with progress + hierarchy
 *   post:
 *     tags: [Epics]
 *     summary: Create an epic (TENANT_ADMIN)
 *     responses:
 *       201:
 *         description: Created epic
 */

/**
 * @swagger
 * /epics/{id}:
 *   get:
 *     tags: [Epics]
 *     summary: Get epic detail (features, sub-epics, ancestors, dependencies)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Epic detail
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Epics]
 *     summary: Update an epic (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Updated epic
 *   delete:
 *     tags: [Epics]
 *     summary: Delete an epic (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Deleted
 */

/**
 * @swagger
 * /epics/{id}/features:
 *   post:
 *     tags: [Epics]
 *     summary: Link a feature to an epic (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Feature linked
 */

/**
 * @swagger
 * /epics/{id}/blockers:
 *   post:
 *     tags: [Epics]
 *     summary: Add a blocker dependency (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Blocker added
 */

/**
 * @swagger
 * /epics/{id}/tickets:
 *   get:
 *     tags: [Epics]
 *     summary: List tickets linked to an epic
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Ticket list
 */

/**
 * @swagger
 * /epics/{id}/sub-epics:
 *   get:
 *     tags: [Epics]
 *     summary: List direct child epics
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Sub-epic list
 */

/**
 * @swagger
 * /epics/{id}/relations:
 *   get:
 *     tags: [Epics]
 *     summary: List soft relations for an epic (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Relation list
 */

/**
 * @swagger
 * /epics/{id}/auto-close:
 *   get:
 *     tags: [Epics]
 *     summary: Check if an epic is eligible for auto-close
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Eligibility result
 */

/**
 * @swagger
 * /epics/{id}/burndown:
 *   get:
 *     tags: [Epics]
 *     summary: Burndown chart data with velocity projection
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Burndown data points
 */
