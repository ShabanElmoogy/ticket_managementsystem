import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Dashboard Routes
router.get('/stats', authenticateToken, dashboardController.getStats);
router.get('/activities', authenticateToken, dashboardController.getActivities);

export default router;