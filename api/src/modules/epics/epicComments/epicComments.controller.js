/**
 * epicComments.controller.js
 * HTTP handlers for epic comments.
 */

import { handleError } from '../../../errors/index.js';
import * as epicCommentsService from './epicComments.service.js';

const actorId   = (req) => req.user?.userId ?? req.user?.id;
const safeEmit  = (req) => typeof req.emitNotification === 'function' ? req.emitNotification : null;

export const listEpicComments = async (req, res) => {
  try {
    res.json(await epicCommentsService.listComments(req.params.id));
  } catch (e) { handleError(res, e, 'List epic comments'); }
};

export const createEpicComment = async (req, res) => {
  try {
    const comment = await epicCommentsService.createComment(
      req.params.id,
      req.body.content,
      actorId(req),
      safeEmit(req),
    );
    res.status(201).json(comment);
  } catch (e) { handleError(res, e, 'Create epic comment'); }
};

export const deleteEpicComment = async (req, res) => {
  try {
    res.json(await epicCommentsService.deleteComment(
      req.params.commentId,
      actorId(req),
      req.user?.role,
    ));
  } catch (e) { handleError(res, e, 'Delete epic comment'); }
};
