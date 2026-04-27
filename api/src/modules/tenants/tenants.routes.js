import express from 'express';
import { authenticateToken, requireSuperAdmin, requireTenantAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createTenantSchema, updateTenantSchema } from './tenants.validation.js';
import {
  listTenants, listTenantsPublic, getTenantBySlug, getTenantStats,
  createTenant, updateTenant, activateTenant, deactivateTenant, deleteTenant,
  getPaginationSettings, updatePaginationSettings,
} from './tenants.controller.js';

const router = express.Router();

// ── Public routes — no auth required ─────────────────────────────────────────

router.get('/public',        listTenantsPublic);
router.get('/by-slug/:slug', getTenantBySlug);

// ── Pagination settings — own tenant (TENANT_ADMIN) ───────────────────────────
// GET  /tenants/pagination-settings       → read own tenant settings
// PATCH /tenants/pagination-settings      → update own tenant settings

router.get('/pagination-settings',   authenticateToken, requireTenantAdmin, getPaginationSettings);
router.patch('/pagination-settings', authenticateToken, requireTenantAdmin, updatePaginationSettings);

// ── Protected routes — SUPER_ADMIN only ──────────────────────────────────────

router.get('/',  authenticateToken, requireSuperAdmin, listTenants);
router.post('/', authenticateToken, requireSuperAdmin, validate(createTenantSchema), createTenant);

router.patch('/:id',  authenticateToken, requireSuperAdmin, validate(updateTenantSchema), updateTenant);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteTenant);

router.patch('/:id/activate',   authenticateToken, requireSuperAdmin, activateTenant);
router.patch('/:id/deactivate', authenticateToken, requireSuperAdmin, deactivateTenant);

router.get('/:id/stats', authenticateToken, requireSuperAdmin, getTenantStats);

// Super admin can also read/update any tenant's pagination settings
router.get('/:id/pagination-settings',   authenticateToken, requireSuperAdmin, getPaginationSettings);
router.patch('/:id/pagination-settings', authenticateToken, requireSuperAdmin, updatePaginationSettings);

export default router;
