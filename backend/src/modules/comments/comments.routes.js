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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 */
router.post('/:id/comments', authenticateToken, validate(createCommentSchema), commentsController.createComment);

export default router;