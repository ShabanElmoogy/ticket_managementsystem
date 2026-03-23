import express from 'express';
import * as commentsController from './comments.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createCommentSchema } from './comments.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Ticket comments
 */

/**
 * @swagger
 * /tickets/{id}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment to a ticket
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateComment'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Comment'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/:id/comments', authenticateToken, validate(createCommentSchema), commentsController.createComment);

export default router;