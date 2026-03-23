import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../../middleware/auth.js';
import {
  createTenant,
  getTenantBySlug,
  listTenants,
  updateTenant,
} from './tenants.controller.js';
import { validate } from '../../middleware/validate.js';
import { createTenantSchema, updateTenantSchema } from './tenants.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management (SUPER_ADMIN)
 */

/**
 * @swagger
 * /tenants:
 *   get:
 *     tags: [Tenants]
 *     summary: List all tenants (SUPER_ADMIN)
 *     responses:
 *       200:
 *         description: Array of tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tenant'
 *   post:
 *     tags: [Tenants]
 *     summary: Create a tenant (SUPER_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:               { type: string }
 *               slug:               { type: string }
 *               subscriptionPlan:   { type: string }
 *               subscriptionStatus: { type: string }
 *               subscriptionSeats:  { type: integer }
 *     responses:
 *       201:
 *         description: Created tenant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 */
router.get('/', authenticateToken, requireSuperAdmin, listTenants);
router.post('/', authenticateToken, requireSuperAdmin, validate(createTenantSchema), createTenant);

/**
 * @swagger
 * /tenants/{id}:
 *   patch:
 *     tags: [Tenants]
 *     summary: Update a tenant (SUPER_ADMIN)
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
 *               name:               { type: string }
 *               slug:               { type: string }
 *               subscriptionPlan:   { type: string }
 *               subscriptionStatus: { type: string }
 *               subscriptionSeats:  { type: integer }
 *     responses:
 *       200:
 *         description: Updated tenant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 */
router.patch('/:id', authenticateToken, requireSuperAdmin, validate(updateTenantSchema), updateTenant);

/**
 * @swagger
 * /tenants/by-slug/{slug}:
 *   get:
 *     tags: [Tenants]
 *     summary: Resolve tenant by slug (public)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/by-slug/:slug', getTenantBySlug);

export default router;
