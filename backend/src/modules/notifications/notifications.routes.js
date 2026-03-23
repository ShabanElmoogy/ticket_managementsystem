import express from 'express';
import * as notificationsController from './notifications.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
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
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     responses:
 *       200:
 *         description: Array of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get('/', authenticateToken, resolveTenant, validate(notificationQuerySchema, 'query'), notificationsController.getNotifications);

/**
 * @swagger
 * /notifications/count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     responses:
 *       200:
 *         description: Count object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get('/count', authenticateToken, resolveTenant, notificationsController.getNotificationCount);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.put('/read-all', authenticateToken, resolveTenant, notificationsController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.put('/:id/read', authenticateToken, resolveTenant, notificationsController.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', authenticateToken, resolveTenant, notificationsController.deleteNotification);

export default router;
