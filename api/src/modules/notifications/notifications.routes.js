import express from 'express';
import * as notificationsController from './notifications.controller.js';
import * as pushTokensController from './pushTokens/pushTokens.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { enforceTenantScope } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { notificationQuerySchema } from './notifications.validation.js';

const router = express.Router();

// ── Notification list & count ─────────────────────────────────────────────────
// My notifications (user-scoped)
router.get('/', authenticateToken, validate(notificationQuerySchema, 'query'), notificationsController.getNotifications);
router.get('/count', authenticateToken, notificationsController.getNotificationCount);

// ── Tenant activity feed — all notifications in the tenant ────────────────────
// Used by ActivityFeedScreen to show everything happening in the tenant.
router.get('/feed', authenticateToken, enforceTenantScope, notificationsController.getTenantFeed);

// ── Push token registration (static routes before /:id) ──────────────────────
router.post('/push-token',   authenticateToken, pushTokensController.registerPushToken);
router.delete('/push-token', authenticateToken, pushTokensController.deletePushToken);

// ── Bulk read / unread (static routes before /:id) ───────────────────────────
router.put('/read-all',    authenticateToken, notificationsController.markAllAsRead);
router.post('/read-all',   authenticateToken, notificationsController.markAllAsRead);
router.put('/unread-all',  authenticateToken, notificationsController.markAllAsUnread);
router.post('/unread-all', authenticateToken, notificationsController.markAllAsUnread);

// ── Per-notification actions (parameterised routes last) ──────────────────────
router.patch('/:id/read',   authenticateToken, notificationsController.markAsRead);
router.put('/:id/read',     authenticateToken, notificationsController.markAsRead);
router.patch('/:id/unread', authenticateToken, notificationsController.markAsUnread);
router.put('/:id/unread',   authenticateToken, notificationsController.markAsUnread);

router.delete('/:id', authenticateToken, notificationsController.deleteNotification);

export default router;
