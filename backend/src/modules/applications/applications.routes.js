import express from 'express';
import * as applicationsController from './applications.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createApplicationSchema, updateApplicationSchema, assignCustomerSchema } from './applications.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Application management (tenant-scoped)
 */

/**
 * @swagger
 * /applications:
 *   get:
 *     tags: [Applications]
 *     summary: List applications
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     responses:
 *       200:
 *         description: Array of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *   post:
 *     tags: [Applications]
 *     summary: Create an application (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Created application
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 */
router.get('/', authenticateToken, applicationsController.getAllApplications);
router.post('/', authenticateToken, requireTenantAdmin, validate(createApplicationSchema), applicationsController.createApplication);

/**
 * @swagger
 * /applications/assign-customer:
 *   post:
 *     tags: [Applications]
 *     summary: Assign a customer to an application (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [applicationId, customerId]
 *             properties:
 *               applicationId: { type: string, format: uuid }
 *               customerId:    { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Assignment created
 */
router.post('/assign-customer', authenticateToken, requireTenantAdmin, validate(assignCustomerSchema), applicationsController.assignCustomer);

/**
 * @swagger
 * /applications/{id}:
 *   get:
 *     tags: [Applications]
 *     summary: Get application by ID
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Application object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Applications]
 *     summary: Update application (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated application
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *   delete:
 *     tags: [Applications]
 *     summary: Delete application (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get('/:id', authenticateToken, applicationsController.getApplicationById);
router.put('/:id', authenticateToken, requireTenantAdmin, validate(updateApplicationSchema), applicationsController.updateApplication);
router.delete('/:id', authenticateToken, requireTenantAdmin, applicationsController.deleteApplication);

/**
 * @swagger
 * /applications/{applicationId}/customers/{customerId}:
 *   delete:
 *     tags: [Applications]
 *     summary: Remove customer from application (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Removed
 */
router.delete('/:applicationId/customers/:customerId', authenticateToken, requireTenantAdmin, applicationsController.removeCustomer);

export default router;
