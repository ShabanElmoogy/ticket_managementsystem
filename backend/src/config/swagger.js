import swaggerJsdoc from 'swagger-jsdoc';
import { components } from './swagger.components.js';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Ticket Management System API',
      version: '1.0.0',
      description:
        'Multi-tenant SaaS ticketing platform. ' +
        'Most endpoints require a Bearer JWT (`Authorization: Bearer <token>`). ' +
        'Tenant-scoped endpoints also require `X-Tenant-Slug` or `X-Tenant-Id`.',
    },
    servers: [{ url: '/api', description: 'Current server' }],
    components,
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/modules/auth/auth.routes.js',
    './src/modules/tickets/tickets.routes.js',
    './src/modules/users/users.routes.js',
    './src/modules/tenants/tenants.routes.js',
    './src/modules/customers/customers.routes.js',
    './src/modules/applications/applications.routes.js',
    './src/modules/comments/comments.routes.js',
    './src/modules/notifications/notifications.routes.js',
    './src/modules/labels/labels.routes.js',
    './src/modules/tasks/tasks.routes.js',
    './src/modules/kanban/kanban.routes.js',
    './src/modules/reminders/reminders.routes.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
