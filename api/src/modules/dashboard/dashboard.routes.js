import express from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { enforceTenantScope } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { activitiesQuerySchema } from './dashboard.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics and activity feed
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Ticket counts and performance metrics
 *     description: >
 *       Returns total, open, in-progress, and resolved ticket counts scoped to
 *       the current user's tenant (or global for SUPER_ADMIN). Non-admin users
 *       see only tickets assigned to them.
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTickets:          { type: integer }
 *                 openTickets:           { type: integer }
 *                 inProgressTickets:     { type: integer }
 *                 resolvedTickets:       { type: integer }
 *                 avgEstimationAccuracy: { type: number, nullable: true }
 *                 avgResolutionHours:    { type: number, nullable: true }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stats', authenticateToken, enforceTenantScope, dashboardController.getStats);

/**
 * @swagger
 * /dashboard/activities:
 *   get:
 *     tags: [Dashboard]
 *     summary: Recent ticket activity feed
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: Activity list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:        { type: string }
 *                   type:      { type: string }
 *                   data:      { type: object }
 *                   timestamp: { type: string, format: date-time }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/activities', authenticateToken, enforceTenantScope, validate(activitiesQuerySchema, 'query'), dashboardController.getActivities);

export default router;
