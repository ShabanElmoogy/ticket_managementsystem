/**
 * comments.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 */

import * as commentsService from './comments.service.js';
import { handleError } from '../../errors/index.js';

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getComments = async (req, res) => {
  try {
    res.json(await commentsService.getComments(req.params.id, req.user));
  } catch (e) { handleError(res, e, 'Get comments'); }
};

export const createComment = async (req, res) => {
  try {
    const result = await commentsService.createComment(
      req.params.id,
      req.body.content,
      req.user,
      req.emitNotification,
    );
    res.status(201).json(result);
  } catch (e) { handleError(res, e, 'Create comment'); }
};

export const deleteComment = async (req, res) => {
  try {
    res.json(await commentsService.deleteComment(
      req.params.id,
      req.params.commentId,
      req.user,
      req.emitNotification,
    ));
  } catch (e) { handleError(res, e, 'Delete comment'); }
};
