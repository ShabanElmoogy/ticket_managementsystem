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
  // Glob picks up every routes file and dedicated docs file automatically.
  apis: [
    './src/modules/**/*.routes.js',
    './src/modules/**/*.docs.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
