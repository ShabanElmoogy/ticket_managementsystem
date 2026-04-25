/** @file Swagger/OpenAPI documentation for Customers routes. */

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management (tenant-scoped)
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     tags: [Customers]
 *     summary: List customers in the resolved tenant
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CustomerList'
 *   post:
 *     tags: [Customers]
 *     summary: Create a customer (TENANT_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateCustomer'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Customer'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /customers/assign-application:
 *   post:
 *     tags: [Customers]
 *     summary: Assign an application to a customer (TENANT_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/AssignApplicationToCustomer'
 *     responses:
 *       201:
 *         description: Assignment created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Customer'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Customers]
 *     summary: Update customer (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateCustomer'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Customer'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Customers]
 *     summary: Delete customer (TENANT_ADMIN)
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
 * /customers/{customerId}/applications/{applicationId}:
 *   delete:
 *     tags: [Customers]
 *     summary: Remove application from customer (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathCustomerId'
 *       - $ref: '#/components/parameters/PathApplicationId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
