import express from 'express';
import * as usersController from './users.controller.js';
import { authenticateToken, requireSuperAdmin, requireTenantAdmin, requireAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema, updateOwnProfileSchema } from './users.validation.js';

const router = express.Router();

router.get('/',  authenticateToken, requireSuperAdmin, usersController.getAllUsers);
router.post('/', authenticateToken, requireSuperAdmin, requireTenantScopeMiddleware, validate(createUserSchema), usersController.createUser);

router.get('/stats', authenticateToken, requireTenantAdmin, usersController.getUserStats);

router.get('/tenant',        authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, usersController.getTenantUsers);
router.post('/tenant',       authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(createUserSchema), usersController.createTenantUser);
router.get('/tenant/seats',  authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, usersController.getTenantSeats);
router.put('/tenant/:id',    authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(updateUserSchema), usersController.updateTenantUser);
router.delete('/tenant/:id', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, usersController.deleteTenantUser);
router.post('/tenant/:id/reset-password', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, usersController.resetTenantUserPassword);

router.get('/profile',              authenticateToken, usersController.getCurrentProfile);
router.put('/profile',              authenticateToken, validate(updateOwnProfileSchema), usersController.updateOwnProfile);
router.get('/profile/tenant-status', authenticateToken, usersController.getTenantStatus);

router.get('/employees',  authenticateToken, enforceTenantScope, usersController.getEmployees);
router.get('/programmers', authenticateToken, requireAdmin, enforceTenantScope, usersController.getProgrammers);

router.get('/:id',    authenticateToken, requireSuperAdmin, usersController.getUserById);
router.put('/:id',    authenticateToken, requireSuperAdmin, validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', authenticateToken, requireSuperAdmin, usersController.deleteUser);
router.post('/:id/reset-password', authenticateToken, requireSuperAdmin, usersController.resetUserPassword);

export default router;
