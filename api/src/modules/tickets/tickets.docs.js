/** @file Swagger/OpenAPI documentation for Tickets routes. */

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket lifecycle management
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: List all tickets (tenant-scoped)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [OPEN, IN_PROGRESS, PROGRAMMING, UNDER_DEVELOPMENT, CODE_REVIEW, TESTING, RESOLVED, CLOSED] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *       - in: query
 *         name: assignedTo
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TicketList'
 *   post:
 *     tags: [Tickets]
 *     summary: Create a ticket (TENANT_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateTicket'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Ticket'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /tickets/delayed:
 *   get:
 *     tags: [Tickets]
 *     summary: List overdue / delayed tickets
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TicketList'
 */

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Get a ticket by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Ticket'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Tickets]
 *     summary: Update a ticket
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateTicket'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Ticket'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   delete:
 *     tags: [Tickets]
 *     summary: Delete a ticket (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /tickets/{id}/take:
 *   post:
 *     tags: [Tickets]
 *     summary: Self-assign (take) a ticket
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Ticket'
 */

/**
 * @swagger
 * /tickets/{id}/watchers:
 *   get:
 *     tags: [Tickets]
 *     summary: List watchers of a ticket
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Watcher list
 */

/**
 * @swagger
 * /tickets/{id}/watch:
 *   post:
 *     tags: [Tickets]
 *     summary: Watch a ticket (current user)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: '{ watching: true }'
 *   delete:
 *     tags: [Tickets]
 *     summary: Unwatch a ticket (current user)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: '{ watching: false }'
 */
