import express from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authRateLimit } from '../../middleware/index.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation.js';

const router = express.Router();

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
router.post('/register', authRateLimit, validate(registerSchema), authController.register);

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
router.post('/login', authRateLimit, validate(loginSchema), authController.login);

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
router.post('/refresh', authRateLimit, validate(refreshTokenSchema), authController.refreshToken);

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
router.post('/logout', authController.logout);

// Dev-only: quick login without password (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-login', authController.devLogin);
}

export default router;