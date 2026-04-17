import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { authenticateToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { uploadMedia, deleteMedia } from './uploads.controller.js';
import { UPLOADS_DIR } from '../attachments/attachments.upload.js';

const router = express.Router();

// ── Shared storage (same /uploads/ folder) ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

// ── Video upload ──────────────────────────────────────────────────────────────
const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime',
  'video/x-msvideo', 'video/mpeg', 'video/3gpp',
];

const videoUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    ALLOWED_VIDEO_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  },
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB — no files limit, single() handles that
});

// ── Image upload ──────────────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

const imageUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    ALLOWED_IMAGE_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── PDF upload ────────────────────────────────────────────────────────────────
const pdfUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error(`Only PDF files are allowed`), false);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ── Excel / spreadsheet upload ────────────────────────────────────────────────
const ALLOWED_EXCEL_TYPES = [
  'application/vnd.ms-excel',                                          // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',                                                          // .csv
  'application/csv',
  'text/plain',                                                        // some .csv uploads
];

const excelUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ALLOWED_EXCEL_TYPES.includes(file.mimetype)
      || ['.xls', '.xlsx', '.csv'].includes(ext);
    allowed
      ? cb(null, true)
      : cb(new Error(`Only Excel/CSV files are allowed`), false);
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ── Multer error wrapper ──────────────────────────────────────────────────────
// Multer errors bypass the controller's try/catch and return HTML by default.
// This wrapper catches them and returns proper JSON so the mobile client
// can parse the error message.
function withMulter(multerMiddleware, handler) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        // MulterError (file too large, unexpected field, etc.)
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File too large' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ error: 'Unexpected file field' });
        }
        // fileFilter rejection or other multer error
        return res.status(400).json({ error: err.message || 'Upload error' });
      }
      // No multer error — run the actual controller
      return handler(req, res, next);
    });
  };
}

router.use(resolveTenant);

// POST /uploads/media  — single video upload
router.post('/media',
  authenticateToken,
  withMulter(videoUpload.single('file'), uploadMedia),
);

// DELETE /uploads/media — delete video or image by URL
router.delete('/media', authenticateToken, deleteMedia);

// POST /uploads/image  — single image upload
router.post('/image',
  authenticateToken,
  withMulter(imageUpload.single('file'), uploadMedia),
);

// POST /uploads/pdf  — single PDF upload
router.post('/pdf',
  authenticateToken,
  withMulter(pdfUpload.single('file'), uploadMedia),
);

// POST /uploads/excel  — single Excel/CSV upload
router.post('/excel',
  authenticateToken,
  withMulter(excelUpload.single('file'), uploadMedia),
);

export default router;
