/** @file Swagger/OpenAPI documentation for Applications routes. */

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Application management (tenant-scoped)
 */

/**
 * @swagger
 * /applications:
 *   get:
 *     tags: [Applications]
 *     summary: List applications
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ApplicationList'
 *   post:
 *     tags: [Applications]
 *     summary: Create an application (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateApplication'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Application'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /applications/assign-customer:
 *   post:
 *     tags: [Applications]
 *     summary: Assign a customer to an application (TENANT_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/AssignCustomerToApp'
 *     responses:
 *       201:
 *         description: Assignment created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /applications/{id}:
 *   get:
 *     tags: [Applications]
 *     summary: Get application by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Application'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Applications]
 *     summary: Update application (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateApplication'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Application'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Applications]
 *     summary: Delete application (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /applications/{applicationId}/customers/{customerId}:
 *   delete:
 *     tags: [Applications]
 *     summary: Remove customer from application (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathApplicationId'
 *       - $ref: '#/components/parameters/PathCustomerId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
