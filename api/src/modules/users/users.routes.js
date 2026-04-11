import express from 'express';
import * as usersController from './users.controller.js';
import { authenticateToken, requireSuperAdmin, requireTenantAdmin, requireAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema, updateOwnProfileSchema } from './users.validation.js';

const router = express.Router();

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
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
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
router.get('/', authenticateToken, requireSuperAdmin, usersController.getAllUsers);
router.post('/', authenticateToken, requireSuperAdmin, resolveTenant, validate(createUserSchema), usersController.createUser);

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
router.get('/stats', authenticateToken, requireTenantAdmin, usersController.getUserStats);

/**
 * @swagger
 * /users/tenant:
 *   get:
 *     tags: [Users]
 *     summary: List users in the resolved tenant (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UserList'
 *   post:
 *     tags: [Users]
 *     summary: Create a user in the resolved tenant (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
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
router.get('/tenant', authenticateToken, resolveTenant, requireTenantAdmin, usersController.getTenantUsers);
router.post('/tenant', authenticateToken, resolveTenant, requireTenantAdmin, validate(createUserSchema), usersController.createTenantUser);
router.get('/tenant/seats', authenticateToken, resolveTenant, requireTenantAdmin, usersController.getTenantSeats);
router.post('/tenant/:id/reset-password', authenticateToken, requireTenantAdmin, usersController.resetTenantUserPassword);

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
router.get('/profile', authenticateToken, usersController.getCurrentProfile);
router.put('/profile', authenticateToken, validate(updateOwnProfileSchema), usersController.updateOwnProfile);
router.get('/profile/tenant-status', authenticateToken, usersController.getTenantStatus);

/**
 * @swagger
 * /users/employees:
 *   get:
 *     tags: [Users]
 *     summary: List employees in the resolved tenant
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UserList'
 */
router.get('/employees', authenticateToken, usersController.getEmployees);
router.get('/programmers', authenticateToken, requireAdmin, usersController.getProgrammers);

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
router.get('/:id', authenticateToken, requireSuperAdmin, usersController.getUserById);
router.put('/:id', authenticateToken, requireSuperAdmin, validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', authenticateToken, requireSuperAdmin, usersController.deleteUser);
router.post('/:id/reset-password', authenticateToken, requireSuperAdmin, usersController.resetUserPassword);

export default router;