/** @file Swagger/OpenAPI documentation for Dashboard routes. */

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
 */

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
 *     responses:
 *       200:
 *         description: Activity list
 */
