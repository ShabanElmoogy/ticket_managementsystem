import express from 'express';
import * as customersController from './customers.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, customersController.getAllCustomers);

// Get customer by ID
router.get('/:id', authenticateToken, customersController.getCustomerById);

// Create new customer (admin only)
router.post('/', authenticateToken, requireTenantAdmin, customersController.createCustomer);

// Update customer (admin only)
router.put('/:id', authenticateToken, requireTenantAdmin, customersController.updateCustomer);

// Delete customer (admin only)
router.delete('/:id', authenticateToken, requireTenantAdmin, customersController.deleteCustomer);

// Assign application to customer (admin only)
router.post('/assign-application', authenticateToken, requireTenantAdmin, customersController.assignApplication);

// Remove application from customer (admin only)
router.delete('/:customerId/applications/:applicationId', authenticateToken, requireTenantAdmin, customersController.removeApplication);

export default router;