/** @file Swagger/OpenAPI documentation for Docs (document editor) routes. */

/**
 * @swagger
 * tags:
 *   name: Docs
 *   description: Document editor — docs and tree nodes
 */

/**
 * @swagger
 * /documents:
 *   get:
 *     tags: [Docs]
 *     summary: List all docs
 *     responses:
 *       200:
 *         description: Doc list
 *   post:
 *     tags: [Docs]
 *     summary: Create a doc (TENANT_ADMIN)
 *     responses:
 *       201:
 *         description: Created doc
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     tags: [Docs]
 *     summary: Get a doc by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Doc
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Docs]
 *     summary: Upsert a doc (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Updated doc
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Docs]
 *     summary: Delete a doc (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       204:
 *         description: Deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /documents/tree:
 *   get:
 *     tags: [Docs]
 *     summary: List all tree nodes (flat array)
 *     responses:
 *       200:
 *         description: Node list
 */

/**
 * @swagger
 * /documents/tree/folder:
 *   post:
 *     tags: [Docs]
 *     summary: Create a folder node (TENANT_ADMIN)
 *     responses:
 *       201:
 *         description: Created folder node
 */

/**
 * @swagger
 * /documents/tree/doc:
 *   post:
 *     tags: [Docs]
 *     summary: Create a doc node (TENANT_ADMIN)
 *     responses:
 *       201:
 *         description: Created doc node
 */

/**
 * @swagger
 * /documents/tree/{id}/rename:
 *   put:
 *     tags: [Docs]
 *     summary: Rename a tree node (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Updated node
 */

/**
 * @swagger
 * /documents/tree/{id}/move:
 *   put:
 *     tags: [Docs]
 *     summary: Move a tree node (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Updated node
 */

/**
 * @swagger
 * /documents/tree/{id}:
 *   delete:
 *     tags: [Docs]
 *     summary: Delete a tree node and its subtree (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       204:
 *         description: Deleted
 */
