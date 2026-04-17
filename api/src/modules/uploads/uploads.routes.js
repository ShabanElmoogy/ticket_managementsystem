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
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];

const videoUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    ALLOWED_VIDEO_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  },
  limits: { fileSize: 100 * 1024 * 1024, files: 1 }, // 100 MB
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
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10 MB
});

router.use(resolveTenant);

// POST /uploads/media  — video
router.post('/media', authenticateToken, videoUpload.single('file'), uploadMedia);
// DELETE /uploads/media — video or image
router.delete('/media', authenticateToken, deleteMedia);
// POST /uploads/image  — image
router.post('/image', authenticateToken, imageUpload.single('file'), uploadMedia);

export default router;
