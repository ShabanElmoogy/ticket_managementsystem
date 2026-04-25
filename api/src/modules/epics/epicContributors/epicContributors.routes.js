/**
 * epicContributors/epicContributors.routes.js
 * Contributors on an epic.
 * Mounted at /epics by the top-level router.
 */

import express from 'express';
import { requireTenantAdmin } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { addContributorSchema, updateContributorSchema } from './epicContributors.validation.js';
import { listContributors, addContributor, updateContributor, removeContributor } from './epicContributors.controller.js';

const router = express.Router();

router.get('/:id/contributors',  listContributors);
router.post('/:id/contributors', requireTenantAdmin, validate(addContributorSchema), addContributor);

router.put('/:id/contributors/:contributorId',    requireTenantAdmin, validate(updateContributorSchema), updateContributor);
router.delete('/:id/contributors/:contributorId', requireTenantAdmin, removeContributor);

export default router;
