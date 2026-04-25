/** @file Swagger/OpenAPI documentation for Kanban routes. */

/**
 * @swagger
 * tags:
 *   name: Kanban
 *   description: Kanban boards, columns, and item movement
 */

/**
 * @swagger
 * /kanban/boards:
 *   get:
 *     tags: [Kanban]
 *     summary: List all active boards (tenant-scoped)
 *     responses:
 *       200:
 *         $ref: '#/components/responses/BoardList'
 *   post:
 *     tags: [Kanban]
 *     summary: Create a board
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateBoard'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Board'
 */

/**
 * @swagger
 * /kanban/boards/{id}:
 *   get:
 *     tags: [Kanban]
 *     summary: Get board by ID with columns, permissions, and items
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Board'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Kanban]
 *     summary: Update a board (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Board'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Kanban]
 *     summary: Delete a board (TENANT_ADMIN)
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
 * /kanban/boards/{boardId}/analytics:
 *   get:
 *     tags: [Kanban]
 *     summary: Get ticket and task counts for a board
 *     parameters:
 *       - name: boardId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: '{ ticketCount: number, taskCount: number }'
 */

/**
 * @swagger
 * /kanban/boards/{boardId}/columns:
 *   post:
 *     tags: [Kanban]
 *     summary: Add a column to a board (TENANT_ADMIN)
 *     parameters:
 *       - name: boardId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       $ref: '#/components/requestBodies/AddColumn'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Column'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /kanban/columns/{columnId}:
 *   put:
 *     tags: [Kanban]
 *     summary: Update a column (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathColumnId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Column'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Kanban]
 *     summary: Delete a column (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathColumnId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /kanban/tickets/{ticketId}/move:
 *   put:
 *     tags: [Kanban]
 *     summary: Move a ticket to a different status / board position
 *     parameters:
 *       - $ref: '#/components/parameters/PathTicketId'
 *     responses:
 *       200:
 *         description: Updated ticket
 */

/**
 * @swagger
 * /kanban/tasks/{taskId}/move:
 *   put:
 *     tags: [Kanban]
 *     summary: Move a task to a different column / position
 *     parameters:
 *       - $ref: '#/components/parameters/PathTaskId'
 *     responses:
 *       200:
 *         description: Task moved
 */
