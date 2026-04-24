import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createTenantSchema, updateTenantSchema } from './tenants.validation.js';
import {
  listTenants, listTenantsPublic, getTenantBySlug, getTenantStats,
  createTenant, updateTenant, activateTenant, deactivateTenant, deleteTenant,
} from './tenants.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management (SUPER_ADMIN) + public lookup endpoints
 */

// ── Public routes — no auth required ─────────────────────────────────────────

/**
 * @swagger
 * /tenants/public:
 *   get:
 *     tags: [Tenants]
 *     summary: List tenants for login dropdown (public)
 *     security: []
 *     description: Returns id, name, slug + first admin/employee/programmer email per tenant.
 *     responses:
 *       200:
 *         description: Tenant list
 */
router.get('/public', listTenantsPublic);

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

// ── Protected routes — SUPER_ADMIN only ──────────────────────────────────────

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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:               { type: string, maxLength: 150 }
 *               slug:               { type: string, maxLength: 63 }
 *               subscriptionPlan:   { type: string, enum: [FREE, BASIC, PRO, ENTERPRISE] }
 *               subscriptionStatus: { type: string, enum: [ACTIVE, SUSPENDED, PAST_DUE, CANCELED, EXPIRED] }
 *               subscriptionStart:  { type: string, format: date-time, nullable: true }
 *               subscriptionEnd:    { type: string, format: date-time, nullable: true }
 *               subscriptionSeats:  { type: integer, minimum: 0 }
 *               supportEmail:       { type: string, format: email, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Tenant'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/',  authenticateToken, requireSuperAdmin, listTenants);
router.post('/', authenticateToken, requireSuperAdmin, validate(createTenantSchema), createTenant);

/**
 * @swagger
 * /tenants/{id}:
 *   patch:
 *     tags: [Tenants]
 *     summary: Update a tenant (SUPER_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Tenant'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Tenants]
 *     summary: Soft-delete (suspend) a tenant (SUPER_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Tenant deactivated
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id',  authenticateToken, requireSuperAdmin, validate(updateTenantSchema), updateTenant);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteTenant);

/**
 * @swagger
 * /tenants/{id}/activate:
 *   patch:
 *     tags: [Tenants]
 *     summary: Activate a tenant (SUPER_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Tenant'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/activate',   authenticateToken, requireSuperAdmin, activateTenant);

/**
 * @swagger
 * /tenants/{id}/deactivate:
 *   patch:
 *     tags: [Tenants]
 *     summary: Deactivate (suspend) a tenant (SUPER_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Tenant'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/deactivate', authenticateToken, requireSuperAdmin, deactivateTenant);

/**
 * @swagger
 * /tenants/{id}/stats:
 *   get:
 *     tags: [Tenants]
 *     summary: Get user and ticket counts for a tenant (SUPER_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: '{ userCount: number, ticketCount: number }'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/stats', authenticateToken, requireSuperAdmin, getTenantStats);

export default router;
