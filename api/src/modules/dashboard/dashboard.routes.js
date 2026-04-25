import express from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { enforceTenantScope } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { activitiesQuerySchema } from './dashboard.validation.js';

const router = express.Router();

router.get('/stats', authenticateToken, enforceTenantScope, dashboardController.getStats);

router.get('/activities', authenticateToken, enforceTenantScope, validate(activitiesQuerySchema, 'query'), dashboardController.getActivities);

export default router;
