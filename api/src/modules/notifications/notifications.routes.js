import express from 'express';
import * as notificationsController from './notifications.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { enforceTenantScope } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { notificationQuerySchema } from './notifications.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notifications
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications for the current user
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NotificationList'
 */
router.get('/', authenticateToken, enforceTenantScope, validate(notificationQuerySchema, 'query'), notificationsController.getNotifications);

/**
 * @swagger
 * /notifications/count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     responses:
 *       200:
 *         description: Count object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationCount'
 */
router.get('/count', authenticateToken, enforceTenantScope, notificationsController.getNotificationCount);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
router.put('/read-all', authenticateToken, notificationsController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
router.put('/:id/read', authenticateToken, notificationsController.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
router.delete('/:id', authenticateToken, notificationsController.deleteNotification);

export default router;
