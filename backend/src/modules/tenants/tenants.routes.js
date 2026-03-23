import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../../middleware/auth.js';
import {
  createTenant,
  getTenantBySlug,
  listTenants,
  listTenantsPublic,
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
 *         $ref: '#/components/responses/TenantList'
 *   post:
 *     tags: [Tenants]
 *     summary: Create a tenant (SUPER_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateTenant'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Tenant'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
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
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateTenant'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Tenant'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
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
 *         schema: { type: string }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Tenant'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/by-slug/:slug', getTenantBySlug);

/**
 * @swagger
 * /tenants/public:
 *   get:
 *     tags: [Tenants]
 *     summary: List tenants for login dropdown (public)
 *     security: []
 *     responses:
 *       200:
 *         description: Array of tenants (id, name, slug only)
 */
router.get('/public', listTenantsPublic);

export default router;
