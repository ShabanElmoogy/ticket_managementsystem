import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../../middleware/auth.js';
import { createTenant, getTenantBySlug, listTenants } from './tenants.controller.js';

const router = express.Router();

// Admin endpoints
router.get('/', authenticateToken, requireSuperAdmin, listTenants);
router.post('/', authenticateToken, requireSuperAdmin, createTenant);

// Public-ish endpoint (used by frontend to resolve tenant by slug)
router.get('/by-slug/:slug', getTenantBySlug);

export default router;
