import express from 'express';
import * as applicationsController from './applications.controller.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Get all applications
router.get('/', authenticateToken, applicationsController.getAllApplications);

// Get application by ID
router.get('/:id', authenticateToken, applicationsController.getApplicationById);

// Create new application (admin only)
router.post('/', authenticateToken, requireAdmin, applicationsController.createApplication);

// Update application (admin only)
router.put('/:id', authenticateToken, requireAdmin, applicationsController.updateApplication);

// Delete application (admin only)
router.delete('/:id', authenticateToken, requireAdmin, applicationsController.deleteApplication);

// Assign customer to application (admin only)
router.post('/assign-customer', authenticateToken, requireAdmin, applicationsController.assignCustomer);

// Remove customer from application (admin only)
router.delete('/:applicationId/customers/:customerId', authenticateToken, requireAdmin, applicationsController.removeCustomer);

export default router;