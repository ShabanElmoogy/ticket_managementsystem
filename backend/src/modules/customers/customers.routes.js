import express from 'express';
import * as customersController from './customers.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, resolveTenant, customersController.getAllCustomers);

// Get customer by ID
router.get('/:id', authenticateToken, resolveTenant, customersController.getCustomerById);

// Create new customer (admin only)
router.post('/', authenticateToken, resolveTenant, requireTenantAdmin, customersController.createCustomer);

// Update customer (admin only)
router.put('/:id', authenticateToken, resolveTenant, requireTenantAdmin, customersController.updateCustomer);

// Delete customer (admin only)
router.delete('/:id', authenticateToken, resolveTenant, requireTenantAdmin, customersController.deleteCustomer);

// Assign application to customer (admin only)
router.post('/assign-application', authenticateToken, resolveTenant, requireTenantAdmin, customersController.assignApplication);

// Remove application from customer (admin only)
router.delete('/:customerId/applications/:applicationId', authenticateToken, resolveTenant, requireTenantAdmin, customersController.removeApplication);

export default router;
