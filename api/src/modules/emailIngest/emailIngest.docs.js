/** @file Swagger/OpenAPI documentation for EmailIngest routes. */

/**
 * @swagger
 * tags:
 *   name: EmailIngest
 *   description: Email-to-ticket ingestion (IMAP)
 */

/**
 * @swagger
 * /email-ingest/settings:
 *   get:
 *     tags: [EmailIngest]
 *     summary: Get current email ingest configuration (ADMIN)
 *     responses:
 *       200:
 *         description: Email ingest settings (no passwords)
 */

/**
 * @swagger
 * /email-ingest/run-now:
 *   post:
 *     tags: [EmailIngest]
 *     summary: Manually trigger email ingestion (ADMIN)
 *     responses:
 *       200:
 *         description: Ingestion completed
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
