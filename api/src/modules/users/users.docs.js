/** @file Swagger/OpenAPI documentation for Users routes. */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all tenant admins (SUPER_ADMIN)
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UserList'
 *   post:
 *     tags: [Users]
 *     summary: Create a user under a tenant (SUPER_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateTenantUser'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /users/stats:
 *   get:
 *     tags: [Users]
 *     summary: User statistics by role (TENANT_ADMIN)
 *     responses:
 *       200:
 *         description: Stats object
 */

/**
 * @swagger
 * /users/tenant:
 *   get:
 *     tags: [Users]
 *     summary: List users in the resolved tenant (TENANT_ADMIN)
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UserList'
 *   post:
 *     tags: [Users]
 *     summary: Create a user in the resolved tenant (TENANT_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateTenantUser'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get own profile
 *     responses:
 *       200:
 *         $ref: '#/components/responses/User'
 *   put:
 *     tags: [Users]
 *     summary: Update own profile
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateOwnProfile'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /users/employees:
 *   get:
 *     tags: [Users]
 *     summary: List employees in the resolved tenant
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UserList'
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (SUPER_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/User'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Users]
 *     summary: Update user by ID (SUPER_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateUser'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/User'
 *   delete:
 *     tags: [Users]
 *     summary: Delete user by ID (SUPER_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - in: query
 *         name: force
 *         schema: { type: boolean }
 *         description: Force-delete and cascade related data
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
