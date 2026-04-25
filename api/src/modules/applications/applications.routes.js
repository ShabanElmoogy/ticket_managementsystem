import express from 'express';
import * as applicationsController from './applications.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { createApplicationSchema, updateApplicationSchema, assignCustomerSchema } from './applications.validation.js';

const router = express.Router();

router.get('/', authenticateToken, enforceTenantScope, applicationsController.getAllApplications);
router.post('/', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(createApplicationSchema), applicationsController.createApplication);

router.post('/assign-customer', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(assignCustomerSchema), applicationsController.assignCustomer);

router.get('/:id', authenticateToken, enforceTenantScope, applicationsController.getApplicationById);
router.put('/:id', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(updateApplicationSchema), applicationsController.updateApplication);
router.delete('/:id', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, applicationsController.deleteApplication);

router.delete('/:applicationId/customers/:customerId', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, applicationsController.removeCustomer);

export default router;
