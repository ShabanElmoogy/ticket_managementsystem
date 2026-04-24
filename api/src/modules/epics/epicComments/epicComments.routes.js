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

/**
 * @swagger
 * /epics/{id}/comments:
 *   get:
 *     tags: [Epics]
 *     summary: List comments on an epic
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Comment list
 *   post:
 *     tags: [Epics]
 *     summary: Add a comment to an epic
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, maxLength: 5000 }
 *     responses:
 *       201:
 *         description: Created comment
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/:id/comments',               listEpicComments);
router.post('/:id/comments',              validate(createEpicCommentSchema), createEpicComment);

/**
 * @swagger
 * /epics/{id}/comments/{commentId}:
 *   delete:
 *     tags: [Epics]
 *     summary: Delete a comment (author or admin)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id/comments/:commentId', deleteEpicComment);

export default router;
