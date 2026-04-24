import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { createTemplateSchema, updateTemplateSchema } from './templates.validation.js';
import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from './templates.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: Ticket templates (global + tenant-scoped)
 */

/**
 * @swagger
 * /templates:
 *   get:
 *     tags: [Templates]
 *     summary: List templates visible to the caller
 *     description: Tenant users see global templates + their own. Super-admin sees global only.
 *     responses:
 *       200:
 *         description: Template list
 *   post:
 *     tags: [Templates]
 *     summary: Create a template (TENANT_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:           { type: string, maxLength: 150 }
 *               description:    { type: string, nullable: true }
 *               priority:       { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *               estimatedHours: { type: number, nullable: true }
 *     responses:
 *       201:
 *         description: Created template
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/',  authenticateToken, enforceTenantScope, listTemplates);
router.post('/', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(createTemplateSchema), createTemplate);

/**
 * @swagger
 * /templates/{id}:
 *   put:
 *     tags: [Templates]
 *     summary: Update a template (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Updated template
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Templates]
 *     summary: Delete a template (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id',    authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(updateTemplateSchema), updateTemplate);
router.delete('/:id', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, deleteTemplate);

export default router;
