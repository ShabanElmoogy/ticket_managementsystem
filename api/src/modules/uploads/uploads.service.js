/**
 * uploads.service.js
 * Business logic for the uploads module.
 * Orchestrates file system operations, enforces rules, throws descriptive errors.
 */

import path from 'path';
import fs from 'fs';
import { UPLOADS_DIR } from '../attachments/attachments.upload.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Operations ────────────────────────────────────────────────────────────────

/**
 * Process a successfully uploaded file and return its hosted URL + metadata.
 * Called after multer has written the file to disk.
 */
export function processUpload(file) {
  if (!file) throw fail('No file uploaded');

  return {
    url:          `/uploads/${file.filename}`,
    filename:     file.filename,
    originalName: file.originalname,
    mimeType:     file.mimetype,
    size:         file.size,
  };
}

/**
 * Delete an uploaded file from disk by its hosted URL.
 * Silently succeeds if the file does not exist (idempotent).
 * Rejects path traversal attempts.
 */
export function deleteUpload(url) {
  if (!url || typeof url !== 'string') throw fail('url is required');

  // Extract just the filename — prevent path traversal
  const filename = path.basename(url);
  if (!filename || filename.includes('..') || filename.includes('/')) {
    throw fail('Invalid filename');
  }

  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return { message: 'Deleted' };
}
