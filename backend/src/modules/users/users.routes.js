import express from 'express';
import * as usersController from './users.controller.js';
import { authenticateToken, requireSuperAdmin, requireTenantAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';

const router = express.Router();

// User Routes
// SUPER_ADMIN: global user management
router.get('/', authenticateToken, requireSuperAdmin, usersController.getAllUsers);
router.get('/stats', authenticateToken, requireSuperAdmin, usersController.getUserStats);
router.get('/tenant', authenticateToken, resolveTenant, requireTenantAdmin, usersController.getTenantUsers);
router.post('/tenant', authenticateToken, resolveTenant, requireTenantAdmin, usersController.createTenantUser);

router.get('/:id', authenticateToken, requireSuperAdmin, usersController.getUserById);
router.put('/:id', authenticateToken, requireSuperAdmin, usersController.updateUser);
router.delete('/:id', authenticateToken, requireSuperAdmin, usersController.deleteUser);

// Shared
// Tenant admins should use /users/tenant to manage users in their tenant.
router.get('/employees', authenticateToken, resolveTenant, requireTenantAdmin, usersController.getEmployees);
router.get('/profile', authenticateToken, usersController.getCurrentProfile);
router.put('/profile', authenticateToken, usersController.updateOwnProfile);

export default router;