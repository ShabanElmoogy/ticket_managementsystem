import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { createTemplateSchema, updateTemplateSchema, applyTemplateSchema } from './epicTemplates.validation.js';
import { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, applyTemplate } from './epicTemplates.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: EpicTemplates
 *   description: Reusable epic templates with pre-defined features and steps
 */

router.use(authenticateToken);

// ── Static routes — must be before /:id ──────────────────────────────────────

/**
 * @swagger
 * /epic-templates/apply/{epicId}:
 *   post:
 *     tags: [EpicTemplates]
 *     summary: Apply a template to an existing epic (TENANT_ADMIN)
 *     description: Bulk-creates feature requests and their steps from the template's features array.
 *     parameters:
 *       - name: epicId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templateId]
 *             properties:
 *               templateId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Features created from template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created:  { type: integer }
 *                 features: { type: array }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/apply/:epicId', requireTenantScopeMiddleware, requireTenantAdmin, validate(applyTemplateSchema), applyTemplate);

// ── Template CRUD ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /epic-templates:
 *   get:
 *     tags: [EpicTemplates]
 *     summary: List templates (global + tenant-own)
 *     description: Tenant users see global templates (no tenantId) plus their own. Super-admin sees all.
 *     responses:
 *       200:
 *         description: Template list
 *   post:
 *     tags: [EpicTemplates]
 *     summary: Create a template (TENANT_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string, maxLength: 150 }
 *               description: { type: string, nullable: true }
 *               category:    { type: string, maxLength: 100 }
 *               features:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:       { type: string }
 *                     description: { type: string }
 *                     steps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:       { type: string }
 *                           description: { type: string }
 *     responses:
 *       201:
 *         description: Created template
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/',    enforceTenantScope, listTemplates);
router.post('/',   requireTenantScopeMiddleware, requireTenantAdmin, validate(createTemplateSchema), createTemplate);

/**
 * @swagger
 * /epic-templates/{id}:
 *   get:
 *     tags: [EpicTemplates]
 *     summary: Get a template by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Template
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [EpicTemplates]
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
 *     tags: [EpicTemplates]
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
router.get('/:id',    getTemplate);
router.put('/:id',    requireTenantAdmin, validate(updateTemplateSchema), updateTemplate);
router.delete('/:id', requireTenantAdmin, deleteTemplate);

export default router;
