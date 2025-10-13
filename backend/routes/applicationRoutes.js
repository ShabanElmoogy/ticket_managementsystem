import express from 'express';
import * as applicationController from '../controllers/applicationController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all applications
router.get('/', authenticateToken, applicationController.getAllApplications);

// Get application by ID
router.get('/:id', authenticateToken, applicationController.getApplicationById);

// Create new application (admin only)
router.post('/', authenticateToken, requireAdmin, applicationController.createApplication);

// Update application (admin only)
router.put('/:id', authenticateToken, requireAdmin, applicationController.updateApplication);

// Delete application (admin only)
router.delete('/:id', authenticateToken, requireAdmin, applicationController.deleteApplication);

// Assign customer to application (admin only)
router.post('/assign-customer', authenticateToken, requireAdmin, applicationController.assignCustomer);

// Remove customer from application (admin only)
router.delete('/:applicationId/customers/:customerId', authenticateToken, requireAdmin, applicationController.removeCustomer);

export default router;