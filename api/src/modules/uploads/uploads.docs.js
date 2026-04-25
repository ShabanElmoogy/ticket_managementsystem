/** @file Swagger/OpenAPI documentation for Uploads routes. */

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Generic file uploads (video, image, PDF, Excel)
 */

/**
 * @swagger
 * /uploads/media:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload a video file (max 500 MB)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: '{ url, filename, originalName, mimeType, size }'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       413:
 *         description: File too large
 *   delete:
 *     tags: [Uploads]
 *     summary: Delete an uploaded file by URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url: { type: string, example: /uploads/filename.mp4 }
 *     responses:
 *       200:
 *         description: '{ message: Deleted }'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /uploads/image:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload an image file (max 10 MB)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: '{ url, filename, originalName, mimeType, size }'
 *       413:
 *         description: File too large
 */

/**
 * @swagger
 * /uploads/pdf:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload a PDF file (max 50 MB)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: '{ url, filename, originalName, mimeType, size }'
 *       413:
 *         description: File too large
 */

/**
 * @swagger
 * /uploads/excel:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload an Excel or CSV file (max 20 MB)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: '{ url, filename, originalName, mimeType, size }'
 *       413:
 *         description: File too large
 */
