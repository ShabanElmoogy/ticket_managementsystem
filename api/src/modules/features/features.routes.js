import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { listFeatures, getFeature, createFeature, updateFeature, deleteFeature, toggleVote } from './features.controller.js';
import { listSteps, createStep, updateStep, deleteStep } from './feature-steps.controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/',       listFeatures);
router.get('/:id',    getFeature);
router.post('/',      createFeature);
router.put('/:id',    requireTenantAdmin, updateFeature);
router.delete('/:id', requireTenantAdmin, deleteFeature);
router.post('/:id/vote', toggleVote);

// Steps
router.get('/:id/steps',              listSteps);
router.post('/:id/steps',             createStep);
router.put('/:id/steps/:stepId',      updateStep);
router.delete('/:id/steps/:stepId',   deleteStep);

export default router;
