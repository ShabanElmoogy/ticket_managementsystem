import express from 'express';
import * as commentsController from './comments.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.post('/:id/comments', authenticateToken, commentsController.createComment);

export default router;