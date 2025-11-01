import express from 'express';
import * as customersController from './customers.controller.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, customersController.getAllCustomers);

// Get customer by ID
router.get('/:id', authenticateToken, customersController.getCustomerById);

// Create new customer (admin only)
router.post('/', authenticateToken, requireAdmin, customersController.createCustomer);

// Update customer (admin only)
router.put('/:id', authenticateToken, requireAdmin, customersController.updateCustomer);

// Delete customer (admin only)
router.delete('/:id', authenticateToken, requireAdmin, customersController.deleteCustomer);

// Assign application to customer (admin only)
router.post('/assign-application', authenticateToken, requireAdmin, customersController.assignApplication);

// Remove application from customer (admin only)
router.delete('/:customerId/applications/:applicationId', authenticateToken, requireAdmin, customersController.removeApplication);

export default router;