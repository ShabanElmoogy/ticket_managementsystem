/**
 * uploads.multer.js
 * Multer middleware instances for each upload type.
 * Kept separate from routes so the storage config and file filters
 * are testable and reusable independently.
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { UPLOADS_DIR } from '../attachments/attachments.upload.js';

// ── Shared disk storage ───────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
    const ext    = path.extname(file.originalname);
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

// ── Allowed MIME types ────────────────────────────────────────────────────────

const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime',
  'video/x-msvideo', 'video/mpeg', 'video/3gpp',
];

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
];

const ALLOWED_EXCEL_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'text/plain',
];

// ── Multer instances ──────────────────────────────────────────────────────────

export const videoUpload = multer({
  storage,
  fileFilter: (_req, file, cb) =>
    ALLOWED_VIDEO_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type not allowed: ${file.mimetype}`), false),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

export const imageUpload = multer({
  storage,
  fileFilter: (_req, file, cb) =>
    ALLOWED_IMAGE_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type not allowed: ${file.mimetype}`), false),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export const pdfUpload = multer({
  storage,
  fileFilter: (_req, file, cb) =>
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Only PDF files are allowed'), false),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

export const excelUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext     = path.extname(file.originalname).toLowerCase();
    const allowed = ALLOWED_EXCEL_TYPES.includes(file.mimetype)
                 || ['.xls', '.xlsx', '.csv'].includes(ext);
    allowed
      ? cb(null, true)
      : cb(new Error('Only Excel/CSV files are allowed'), false);
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ── Error-handling wrapper ────────────────────────────────────────────────────

/**
 * Wraps a multer middleware so that multer errors are returned as JSON
 * instead of the default HTML response.
 *
 * @param {Function} multerMiddleware  — e.g. videoUpload.single('file')
 * @param {Function} handler           — the controller handler to run on success
 */
export function withMulter(multerMiddleware, handler) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE')      return res.status(413).json({ error: 'File too large' });
        if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'Unexpected file field' });
        return res.status(400).json({ error: err.message || 'Upload error' });
      }
      return handler(req, res, next);
    });
  };
}
