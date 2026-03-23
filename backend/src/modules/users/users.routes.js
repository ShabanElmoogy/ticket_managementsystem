import express from 'express';
import * as usersController from './users.controller.js';
import { authenticateToken, requireSuperAdmin, requireTenantAdmin } from '../../middleware/auth.js';
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
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', authenticateToken, requireSuperAdmin, usersController.getAllUsers);

/**
 * @swagger
 * /users/stats:
 *   get:
 *     tags: [Users]
 *     summary: User statistics by role (SUPER_ADMIN)
 *     responses:
 *       200:
 *         description: Stats object
 */
router.get('/stats', authenticateToken, requireSuperAdmin, usersController.getUserStats);

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
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *   post:
 *     tags: [Users]
 *     summary: Create a user in the resolved tenant (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               name:     { type: string }
 *               password: { type: string, minLength: 6 }
 *               role:     { type: string, enum: [TENANT_ADMIN, EMPLOYEE] }
 *               phone:    { type: string }
 *     responses:
 *       201:
 *         description: Created user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/tenant', authenticateToken, resolveTenant, requireTenantAdmin, usersController.getTenantUsers);
router.post('/tenant', authenticateToken, resolveTenant, requireTenantAdmin, validate(createUserSchema), usersController.createTenantUser);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get own profile
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *   put:
 *     tags: [Users]
 *     summary: Update own profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:             { type: string }
 *               email:            { type: string, format: email }
 *               phone:            { type: string, nullable: true }
 *               reminderEnabled:  { type: boolean }
 *               reminderInterval: { type: integer }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/profile', authenticateToken, usersController.getCurrentProfile);
router.put('/profile', authenticateToken, validate(updateOwnProfileSchema), usersController.updateOwnProfile);

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
 *         description: Array of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/employees', authenticateToken, resolveTenant, requireTenantAdmin, usersController.getEmployees);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (SUPER_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Users]
 *     summary: Update user by ID (SUPER_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string }
 *               email: { type: string, format: email }
 *               role:  { type: string, enum: [SUPER_ADMIN, TENANT_ADMIN, EMPLOYEE] }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *   delete:
 *     tags: [Users]
 *     summary: Delete user by ID (SUPER_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *         description: Force-delete and cascade related data
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get('/:id', authenticateToken, requireSuperAdmin, usersController.getUserById);
router.put('/:id', authenticateToken, requireSuperAdmin, validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', authenticateToken, requireSuperAdmin, usersController.deleteUser);

export default router;