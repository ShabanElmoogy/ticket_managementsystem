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

/**
 * @swagger
 * /tickets/{id}/comments/{commentId}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id/comments/:commentId', authenticateToken, commentsController.deleteComment);

export default router;