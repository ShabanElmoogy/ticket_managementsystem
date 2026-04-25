import express from 'express';
import * as customersController from './customers.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { createCustomerSchema, updateCustomerSchema, assignApplicationSchema } from './customers.validation.js';

const router = express.Router();

router.get('/',  authenticateToken, enforceTenantScope, customersController.getAllCustomers);
router.post('/', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(createCustomerSchema), customersController.createCustomer);

router.post('/assign-application', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(assignApplicationSchema), customersController.assignApplication);

router.get('/:id',    authenticateToken, enforceTenantScope, customersController.getCustomerById);
router.put('/:id',    authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(updateCustomerSchema), customersController.updateCustomer);
router.delete('/:id', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, customersController.deleteCustomer);

router.delete('/:customerId/applications/:applicationId', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, customersController.removeApplication);

export default router;
