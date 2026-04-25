import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import {
  createFeatureSchema, updateFeatureSchema,
  createStepSchema, updateStepSchema,
} from './features.validation.js';
import {
  listFeatures, getFeature, createFeature, updateFeature, deleteFeature, toggleVote,
  listSteps, createStep, updateStep, deleteStep,
} from './features.controller.js';

const router = express.Router();

router.use(authenticateToken);

// ── Feature CRUD ──────────────────────────────────────────────────────────────

router.get('/',    enforceTenantScope, listFeatures);
router.post('/',   enforceTenantScope, validate(createFeatureSchema), createFeature);

router.get('/:id',    getFeature);
router.put('/:id',    requireTenantAdmin, validate(updateFeatureSchema), updateFeature);
router.delete('/:id', requireTenantAdmin, deleteFeature);

router.post('/:id/vote', toggleVote);

// ── Feature steps ─────────────────────────────────────────────────────────────

router.get('/:id/steps',  listSteps);
router.post('/:id/steps', validate(createStepSchema), createStep);

router.put('/:id/steps/:stepId',    validate(updateStepSchema), updateStep);
router.delete('/:id/steps/:stepId', deleteStep);

export default router;
