/**
 * attachments.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 */

import { getTenantScope } from '../../utils/tenantUtils.js';
import { handleError } from '../../errors/index.js';
import * as attachmentsService from './attachments.service.js';

// ── Handlers ──────────────────────────────────────────────────────────────────

// POST /tickets/:id/attachments
export const uploadAttachments = async (req, res) => {
  try {
    const scope    = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const result   = await attachmentsService.uploadAttachments(
      req.params.id,
      req.files,
      req.user,
      tenantId,
    );
    res.status(201).json(result);
  } catch (e) { handleError(res, e, 'Upload attachments'); }
};

// GET /tickets/:id/attachments
export const getAttachments = async (req, res) => {
  try {
    const scope    = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    res.json(await attachmentsService.getAttachments(req.params.id, req.user, tenantId));
  } catch (e) { handleError(res, e, 'Get attachments'); }
};

// DELETE /tickets/:id/attachments/:attachmentId
export const deleteAttachment = async (req, res) => {
  try {
    res.json(await attachmentsService.deleteAttachment(
      req.params.id,
      req.params.attachmentId,
      req.user,
    ));
  } catch (e) { handleError(res, e, 'Delete attachment'); }
};
