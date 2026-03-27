import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { upload } from './attachments.upload.js';
import { uploadAttachments, getAttachments, deleteAttachment } from './attachments.controller.js';

const router = express.Router({ mergeParams: true }); // mergeParams to access :id from parent

router.use(resolveTenant);

router.get('/',                    authenticateToken, getAttachments);
router.post('/', authenticateToken, upload.array('files', 5), uploadAttachments);
router.delete('/:attachmentId',    authenticateToken, deleteAttachment);

export default router;
