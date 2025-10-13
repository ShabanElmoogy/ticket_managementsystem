import express from 'express';
import * as customerController from '../controllers/customerController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, customerController.getAllCustomers);

// Get customer by ID
router.get('/:id', authenticateToken, customerController.getCustomerById);

// Create new customer (admin only)
router.post('/', authenticateToken, requireAdmin, customerController.createCustomer);

// Update customer (admin only)
router.put('/:id', authenticateToken, requireAdmin, customerController.updateCustomer);

// Delete customer (admin only)
router.delete('/:id', authenticateToken, requireAdmin, customerController.deleteCustomer);

// Assign application to customer (admin only)
router.post('/assign-application', authenticateToken, requireAdmin, customerController.assignApplication);

// Remove application from customer (admin only)
router.delete('/:customerId/applications/:applicationId', authenticateToken, requireAdmin, customerController.removeApplication);

export default router;