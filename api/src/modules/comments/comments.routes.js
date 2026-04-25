import express from 'express';
import * as commentsController from './comments.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createCommentSchema } from './comments.validation.js';

const router = express.Router();

router.post('/:id/comments', authenticateToken, validate(createCommentSchema), commentsController.createComment);

router.delete('/:id/comments/:commentId', authenticateToken, commentsController.deleteComment);

export default router;