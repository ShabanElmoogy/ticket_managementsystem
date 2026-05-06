import express from 'express';
import * as notificationsController from './notifications.controller.js';
import * as pushTokensController from './pushTokens/pushTokens.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { enforceTenantScope } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { notificationQuerySchema } from './notifications.validation.js';

const router = express.Router();

// ── Notification list & count ─────────────────────────────────────────────────
router.get('/', authenticateToken, enforceTenantScope, validate(notificationQuerySchema, 'query'), notificationsController.getNotifications);

router.get('/count', authenticateToken, enforceTenantScope, notificationsController.getNotificationCount);

// ── Push token registration (static routes before /:id) ──────────────────────
// POST   /notifications/push-token  — register / upsert a device push token
router.post('/push-token', authenticateToken, pushTokensController.registerPushToken);

// DELETE /notifications/push-token  — remove all push tokens on logout
router.delete('/push-token', authenticateToken, pushTokensController.deletePushToken);

// ── Bulk read ─────────────────────────────────────────────────────────────────
router.put('/read-all', authenticateToken, notificationsController.markAllAsRead);
// POST alias used by mobile client
router.post('/read-all', authenticateToken, notificationsController.markAllAsRead);

// ── Per-notification actions (parameterised routes last) ──────────────────────
// PATCH  /notifications/:id/read  — mark single notification as read (mobile spec)
router.patch('/:id/read', authenticateToken, notificationsController.markAsRead);
// PUT alias for backwards compatibility
router.put('/:id/read', authenticateToken, notificationsController.markAsRead);

router.delete('/:id', authenticateToken, notificationsController.deleteNotification);

export default router;
