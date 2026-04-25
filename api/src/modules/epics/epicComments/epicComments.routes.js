/**
 * epicComments/epicComments.routes.js
 * Comments on an epic.
 * Mounted at /epics by the top-level router — routes use /:id/comments prefix.
 */

import express from 'express';
import { validate } from '../../../middleware/validate.js';
import { createEpicCommentSchema } from './epicComments.validation.js';
import { listEpicComments, createEpicComment, deleteEpicComment } from './epicComments.controller.js';

const router = express.Router();

router.get('/:id/comments',               listEpicComments);
router.post('/:id/comments',              validate(createEpicCommentSchema), createEpicComment);

router.delete('/:id/comments/:commentId', deleteEpicComment);

export default router;
