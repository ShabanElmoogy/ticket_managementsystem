/** @file Swagger/OpenAPI documentation for Auth routes. */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication — register, login, token refresh, logout
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive tokens
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/RefreshToken'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke refresh token and logout
 *     security: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/Logout'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
