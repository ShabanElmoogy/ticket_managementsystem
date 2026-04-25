import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createTenantSchema, updateTenantSchema } from './tenants.validation.js';
import {
  listTenants, listTenantsPublic, getTenantBySlug, getTenantStats,
  createTenant, updateTenant, activateTenant, deactivateTenant, deleteTenant,
} from './tenants.controller.js';

const router = express.Router();

// ── Public routes — no auth required ─────────────────────────────────────────

router.get('/public',       listTenantsPublic);
router.get('/by-slug/:slug', getTenantBySlug);

// ── Protected routes — SUPER_ADMIN only ──────────────────────────────────────

router.get('/',  authenticateToken, requireSuperAdmin, listTenants);
router.post('/', authenticateToken, requireSuperAdmin, validate(createTenantSchema), createTenant);

router.patch('/:id',  authenticateToken, requireSuperAdmin, validate(updateTenantSchema), updateTenant);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteTenant);

router.patch('/:id/activate',   authenticateToken, requireSuperAdmin, activateTenant);
router.patch('/:id/deactivate', authenticateToken, requireSuperAdmin, deactivateTenant);

router.get('/:id/stats', authenticateToken, requireSuperAdmin, getTenantStats);

export default router;
