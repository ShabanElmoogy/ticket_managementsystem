import express from 'express';
import * as notificationsController from './notifications.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';

const router = express.Router();

// Notification Routes
// resolveTenant enables scoping by X-Tenant-Id / X-Tenant-Slug when provided.
router.get('/', authenticateToken, resolveTenant, notificationsController.getNotifications);
router.get('/count', authenticateToken, resolveTenant, notificationsController.getNotificationCount);
router.put('/:id/read', authenticateToken, resolveTenant, notificationsController.markAsRead);
router.put('/read-all', authenticateToken, resolveTenant, notificationsController.markAllAsRead);
router.delete('/:id', authenticateToken, resolveTenant, notificationsController.deleteNotification);

export default router;
