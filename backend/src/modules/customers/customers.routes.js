import express from 'express';
import * as customersController from './customers.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { createCustomerSchema, updateCustomerSchema, assignApplicationSchema } from './customers.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management (tenant-scoped)
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     tags: [Customers]
 *     summary: List customers in the resolved tenant
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     responses:
 *       200:
 *         description: Array of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *   post:
 *     tags: [Customers]
 *     summary: Create a customer (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:    { type: string }
 *               email:   { type: string, format: email }
 *               phone:   { type: string, nullable: true }
 *               address: { type: string, nullable: true }
 *               company: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Created customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 */
router.get('/', authenticateToken, resolveTenant, customersController.getAllCustomers);
router.post('/', authenticateToken, resolveTenant, requireTenantAdmin, validate(createCustomerSchema), customersController.createCustomer);

/**
 * @swagger
 * /customers/assign-application:
 *   post:
 *     tags: [Customers]
 *     summary: Assign an application to a customer (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, applicationId]
 *             properties:
 *               customerId:    { type: string, format: uuid }
 *               applicationId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Assignment created
 */
router.post('/assign-application', authenticateToken, resolveTenant, requireTenantAdmin, validate(assignApplicationSchema), customersController.assignApplication);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer by ID
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
 *         description: Customer object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Customers]
 *     summary: Update customer (TENANT_ADMIN)
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
 *               name:    { type: string }
 *               email:   { type: string, format: email }
 *               phone:   { type: string, nullable: true }
 *               address: { type: string, nullable: true }
 *               company: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Updated customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *   delete:
 *     tags: [Customers]
 *     summary: Delete customer (TENANT_ADMIN)
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
router.get('/:id', authenticateToken, resolveTenant, customersController.getCustomerById);
router.put('/:id', authenticateToken, resolveTenant, requireTenantAdmin, validate(updateCustomerSchema), customersController.updateCustomer);
router.delete('/:id', authenticateToken, resolveTenant, requireTenantAdmin, customersController.deleteCustomer);

/**
 * @swagger
 * /customers/{customerId}/applications/{applicationId}:
 *   delete:
 *     tags: [Customers]
 *     summary: Remove application from customer (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Removed
 */
router.delete('/:customerId/applications/:applicationId', authenticateToken, resolveTenant, requireTenantAdmin, customersController.removeApplication);

export default router;
