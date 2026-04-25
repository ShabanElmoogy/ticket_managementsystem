/** @file Swagger/OpenAPI documentation for Tasks routes. */

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Kanban tasks
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks (optionally filtered by boardId)
 *     parameters:
 *       - in: query
 *         name: boardId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TaskList'
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task (TENANT_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateTask'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Task'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Task'
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Task'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task (TENANT_ADMIN)
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
 * /tasks/{id}/move:
 *   put:
 *     tags: [Tasks]
 *     summary: Move a task to a different column / position
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Task'
 */
