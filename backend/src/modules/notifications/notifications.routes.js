import express from 'express';
import * as notificationsController from './notifications.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// Notification Routes
router.get('/', authenticateToken, notificationsController.getNotifications);
router.get('/count', authenticateToken, notificationsController.getNotificationCount);
router.put('/:id/read', authenticateToken, notificationsController.markAsRead);
router.put('/read-all', authenticateToken, notificationsController.markAllAsRead);
router.delete('/:id', authenticateToken, notificationsController.deleteNotification);

export default router;