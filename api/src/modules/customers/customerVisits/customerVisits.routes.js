import express from 'express';
import * as visitsController from './customerVisits.controller.js';
import { authenticateToken } from '../../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../../utils/tenantUtils.js';
import { validate } from '../../../middleware/validate.js';
import { createVisitSchema, updateVisitSchema } from './customerVisits.validation.js';

const router = express.Router({ mergeParams: true }); // mergeParams to access :customerId

// GET    /customers/:customerId/visits
router.get('/',    authenticateToken, enforceTenantScope, visitsController.listVisits);

// POST   /customers/:customerId/visits
router.post('/',   authenticateToken, requireTenantScopeMiddleware, validate(createVisitSchema), visitsController.createVisit);

// GET    /customers/:customerId/visits/:visitId
router.get('/:visitId',    authenticateToken, enforceTenantScope, visitsController.getVisitById);

// PUT    /customers/:customerId/visits/:visitId
router.put('/:visitId',    authenticateToken, requireTenantScopeMiddleware, validate(updateVisitSchema), visitsController.updateVisit);

// DELETE /customers/:customerId/visits/:visitId
router.delete('/:visitId', authenticateToken, requireTenantScopeMiddleware, visitsController.deleteVisit);

export default router;
