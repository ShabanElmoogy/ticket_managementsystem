import express from 'express';
import { authenticateToken, requireAdmin, requireProgrammerOrAdmin } from '../../middleware/auth.js';
import { requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { upsertProgrammingSchema, assignProgrammerSchema } from './programming.validation.js';
import * as ctrl from './programming.controller.js';

const router = express.Router();

// All programming routes require authentication + a resolved tenant scope
router.use(authenticateToken, requireTenantScopeMiddleware);

router.get('/:id/programming', requireProgrammerOrAdmin, ctrl.getProgrammingDetails);
router.put('/:id/programming', requireProgrammerOrAdmin, validate(upsertProgrammingSchema), ctrl.upsertProgrammingDetails);

router.post('/:id/assign-programmer', requireAdmin, validate(assignProgrammerSchema), ctrl.assignProgrammer);

export default router;
