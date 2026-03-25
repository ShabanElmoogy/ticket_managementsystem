import express from 'express';
import { authenticateToken, requireAdmin, requireProgrammerOrAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { upsertProgrammingSchema, assignProgrammerSchema } from './programming.validation.js';
import * as ctrl from './programming.controller.js';

const router = express.Router();
router.use(resolveTenant);

router.get('/:id/programming',        authenticateToken, requireProgrammerOrAdmin, ctrl.getProgrammingDetails);
router.put('/:id/programming',        authenticateToken, requireProgrammerOrAdmin, validate(upsertProgrammingSchema), ctrl.upsertProgrammingDetails);
router.post('/:id/assign-programmer', authenticateToken, requireAdmin, validate(assignProgrammerSchema), ctrl.assignProgrammer);

export default router;
