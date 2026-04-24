/**
 * uploads.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct file system access here.
 */

import { handleError } from '../../errors/index.js';
import * as uploadsService from './uploads.service.js';

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * POST /uploads/media | /uploads/image | /uploads/pdf | /uploads/excel
 * Multer has already written the file to disk before this handler runs.
 */
export const uploadMedia = (req, res) => {
  try {
    const result = uploadsService.processUpload(req.file);
    res.status(201).json(result);
  } catch (e) { handleError(res, e, 'Upload media'); }
};

/**
 * DELETE /uploads/media
 * Body: { url: "/uploads/<filename>" }
 */
export const deleteMedia = (req, res) => {
  try {
    res.json(uploadsService.deleteUpload(req.body.url));
  } catch (e) { handleError(res, e, 'Delete media'); }
};
