import express from 'express';
import * as notificationsController from './notifications.controller.js';
import * as pushTokensController from './pushTokens/pushTokens.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { enforceTenantScope } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { notificationQuerySchema } from './notifications.validation.js';

const router = express.Router();

// ── My notifications (user-scoped) ────────────────────────────────────────────
router.get('/', authenticateToken, validate(notificationQuerySchema, 'query'), notificationsController.getNotifications);

// ── Tenant activity feed — all notifications with per-user read state ─────────
router.get('/feed',  authenticateToken, enforceTenantScope, notificationsController.getTenantFeed);
router.get('/count', authenticateToken, enforceTenantScope, notificationsController.getNotificationCount);

// ── Push token registration (static routes before /:id) ──────────────────────
router.post('/push-token',   authenticateToken, pushTokensController.registerPushToken);
router.delete('/push-token', authenticateToken, pushTokensController.deletePushToken);

// ── Bulk read / unread (tenant-scoped, static routes before /:id) ─────────────
router.put('/read-all',    authenticateToken, enforceTenantScope, notificationsController.markAllAsRead);
router.post('/read-all',   authenticateToken, enforceTenantScope, notificationsController.markAllAsRead);
router.put('/unread-all',  authenticateToken, enforceTenantScope, notificationsController.markAllAsUnread);
router.post('/unread-all', authenticateToken, enforceTenantScope, notificationsController.markAllAsUnread);

// ── Per-notification actions (parameterised routes last) ──────────────────────
router.patch('/:id/read',   authenticateToken, notificationsController.markAsRead);
router.put('/:id/read',     authenticateToken, notificationsController.markAsRead);
router.patch('/:id/unread', authenticateToken, notificationsController.markAsUnread);
router.put('/:id/unread',   authenticateToken, notificationsController.markAsUnread);

router.delete('/:id', authenticateToken, notificationsController.deleteNotification);

export default router;
