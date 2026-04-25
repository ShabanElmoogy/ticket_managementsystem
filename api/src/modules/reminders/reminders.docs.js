/** @file Swagger/OpenAPI documentation for Reminders routes. */

/**
 * @swagger
 * tags:
 *   name: Reminders
 *   description: Reminder settings, delayed tickets, and tenant configuration
 */

/**
 * @swagger
 * /reminders/settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get reminder settings for the current user
 *     responses:
 *       200:
 *         description: '{ reminderEnabled: boolean, reminderInterval: number }'
 *   put:
 *     tags: [Reminders]
 *     summary: Update reminder settings for the current user
 *     responses:
 *       200:
 *         description: Updated settings
 */

/**
 * @swagger
 * /reminders/delayed-tickets:
 *   get:
 *     tags: [Reminders]
 *     summary: Get delayed tickets assigned to the current user
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TicketList'
 */

/**
 * @swagger
 * /reminders/escalate-now:
 *   post:
 *     tags: [Reminders]
 *     summary: Manually trigger priority escalation (ADMIN)
 *     responses:
 *       200:
 *         description: Escalation triggered
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /reminders/escalation-settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get escalation interval (ADMIN)
 *     responses:
 *       200:
 *         description: '{ intervalMinutes: number, scope: string }'
 *   put:
 *     tags: [Reminders]
 *     summary: Update escalation interval (ADMIN)
 *     responses:
 *       200:
 *         description: Updated interval
 */

/**
 * @swagger
 * /reminders/sla-settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get SLA hour thresholds (ADMIN)
 *     responses:
 *       200:
 *         description: SLA settings
 *   put:
 *     tags: [Reminders]
 *     summary: Update SLA hour thresholds (ADMIN)
 *     responses:
 *       200:
 *         description: Updated SLA settings
 */

/**
 * @swagger
 * /reminders/epic-auto-close-settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get epic auto-close setting (ADMIN)
 *     responses:
 *       200:
 *         description: '{ epicAutoClose: boolean }'
 *   put:
 *     tags: [Reminders]
 *     summary: Update epic auto-close setting (ADMIN)
 *     responses:
 *       200:
 *         description: Updated setting
 */

/**
 * @swagger
 * /reminders/date-format-settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get date format for the current tenant (ADMIN)
 *     responses:
 *       200:
 *         description: '{ dateFormat: string }'
 *   put:
 *     tags: [Reminders]
 *     summary: Update date format (ADMIN)
 *     responses:
 *       200:
 *         description: Updated date format
 */
