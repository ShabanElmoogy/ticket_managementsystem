import express from 'express';
import * as applicationsController from './applications.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Get all applications
router.get('/', authenticateToken, applicationsController.getAllApplications);

// Get application by ID
router.get('/:id', authenticateToken, applicationsController.getApplicationById);

// Create new application (admin only)
router.post('/', authenticateToken, requireTenantAdmin, applicationsController.createApplication);

// Update application (admin only)
router.put('/:id', authenticateToken, requireTenantAdmin, applicationsController.updateApplication);

// Delete application (admin only)
router.delete('/:id', authenticateToken, requireTenantAdmin, applicationsController.deleteApplication);

// Assign customer to application (admin only)
router.post('/assign-customer', authenticateToken, requireTenantAdmin, applicationsController.assignCustomer);

// Remove customer from application (admin only)
router.delete('/:applicationId/customers/:customerId', authenticateToken, requireTenantAdmin, applicationsController.removeCustomer);

export default router;