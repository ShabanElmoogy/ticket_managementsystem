import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { deleteMediaSchema } from './uploads.validation.js';
import { uploadMedia, deleteMedia } from './uploads.controller.js';
import { videoUpload, imageUpload, pdfUpload, excelUpload, withMulter } from './uploads.multer.js';

const router = express.Router();

router.post('/media',   authenticateToken, withMulter(videoUpload.single('file'), uploadMedia));
router.delete('/media', authenticateToken, validate(deleteMediaSchema), deleteMedia);
router.post('/image',   authenticateToken, withMulter(imageUpload.single('file'), uploadMedia));
router.post('/pdf',     authenticateToken, withMulter(pdfUpload.single('file'), uploadMedia));
router.post('/excel',   authenticateToken, withMulter(excelUpload.single('file'), uploadMedia));

export default router;
