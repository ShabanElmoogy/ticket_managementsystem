import express from 'express';
import * as customersController from './customers.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
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
 *         $ref: '#/components/responses/CustomerList'
 *   post:
 *     tags: [Customers]
 *     summary: Create a customer (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateCustomer'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Customer'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/',  authenticateToken, enforceTenantScope, customersController.getAllCustomers);
router.post('/', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(createCustomerSchema), customersController.createCustomer);

/**
 * @swagger
 * /customers/assign-application:
 *   post:
 *     tags: [Customers]
 *     summary: Assign an application to a customer (TENANT_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/AssignApplicationToCustomer'
 *     responses:
 *       201:
 *         description: Assignment created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/assign-application', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(assignApplicationSchema), customersController.assignApplication);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Customer'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Customers]
 *     summary: Update customer (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateCustomer'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Customer'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Customers]
 *     summary: Delete customer (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id',    authenticateToken, enforceTenantScope, customersController.getCustomerById);
router.put('/:id',    authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(updateCustomerSchema), customersController.updateCustomer);
router.delete('/:id', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, customersController.deleteCustomer);

/**
 * @swagger
 * /customers/{customerId}/applications/{applicationId}:
 *   delete:
 *     tags: [Customers]
 *     summary: Remove application from customer (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathCustomerId'
 *       - $ref: '#/components/parameters/PathApplicationId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:customerId/applications/:applicationId', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, customersController.removeApplication);

export default router;
