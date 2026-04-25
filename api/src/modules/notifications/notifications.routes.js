import express from 'express';
import * as notificationsController from './notifications.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { enforceTenantScope } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { notificationQuerySchema } from './notifications.validation.js';

const router = express.Router();

router.get('/', authenticateToken, enforceTenantScope, validate(notificationQuerySchema, 'query'), notificationsController.getNotifications);

router.get('/count', authenticateToken, enforceTenantScope, notificationsController.getNotificationCount);

router.put('/read-all', authenticateToken, notificationsController.markAllAsRead);

router.put('/:id/read', authenticateToken, notificationsController.markAsRead);

router.delete('/:id', authenticateToken, notificationsController.deleteNotification);

export default router;
