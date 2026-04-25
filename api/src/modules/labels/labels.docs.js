/** @file Swagger/OpenAPI documentation for Labels routes. */

/**
 * @swagger
 * tags:
 *   name: Labels
 *   description: Ticket labels
 */

/**
 * @swagger
 * /labels:
 *   get:
 *     tags: [Labels]
 *     summary: List all labels with ticket counts
 *     responses:
 *       200:
 *         $ref: '#/components/responses/LabelList'
 *   post:
 *     tags: [Labels]
 *     summary: Create a label (TENANT_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateLabel'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Label'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /labels/assign:
 *   post:
 *     tags: [Labels]
 *     summary: Assign a label to a ticket
 *     requestBody:
 *       $ref: '#/components/requestBodies/AssignLabel'
 *     responses:
 *       201:
 *         description: Assignment with full label object
 */

/**
 * @swagger
 * /labels/{id}:
 *   put:
 *     tags: [Labels]
 *     summary: Update a label (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Label'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Labels]
 *     summary: Delete a label and remove it from all tickets (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /labels/{labelId}/tickets/{ticketId}:
 *   delete:
 *     tags: [Labels]
 *     summary: Remove a label from a specific ticket
 *     parameters:
 *       - $ref: '#/components/parameters/PathLabelId'
 *       - $ref: '#/components/parameters/PathTicketId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
