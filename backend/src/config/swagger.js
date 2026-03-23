import swaggerJsdoc from 'swagger-jsdoc';

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
    servers: [
      { url: '/api', description: 'Current server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      parameters: {
        XTenantSlug: {
          in: 'header',
          name: 'X-Tenant-Slug',
          schema: { type: 'string' },
          description: 'Tenant slug (e.g. `acme`). Required for tenant-scoped endpoints.',
        },
        XTenantId: {
          in: 'header',
          name: 'X-Tenant-Id',
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID. Alternative to X-Tenant-Slug.',
        },
      },
      schemas: {
        // ── Shared primitives ──────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Not found' },
          },
        },
        // ── Auth ──────────────────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['email', 'name', 'password'],
          properties: {
            email:    { type: 'string', format: 'email' },
            name:     { type: 'string', minLength: 1 },
            password: { type: 'string', minLength: 6 },
            role:     { type: 'string', enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE'] },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token:        { type: 'string' },
            refreshToken: { type: 'string' },
            user:         { $ref: '#/components/schemas/User' },
          },
        },
        // ── User ──────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:                   { type: 'string', format: 'uuid' },
            tenantId:             { type: 'string', format: 'uuid', nullable: true },
            email:                { type: 'string', format: 'email' },
            name:                 { type: 'string' },
            role:                 { type: 'string', enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE'] },
            phone:                { type: 'string', nullable: true },
            whatsappNotifications:{ type: 'boolean' },
            reminderEnabled:      { type: 'boolean' },
            reminderInterval:     { type: 'integer' },
            createdAt:            { type: 'string', format: 'date-time' },
            updatedAt:            { type: 'string', format: 'date-time' },
          },
        },
        // ── Tenant ────────────────────────────────────────────────────────
        Tenant: {
          type: 'object',
          properties: {
            id:                 { type: 'string', format: 'uuid' },
            name:               { type: 'string' },
            slug:               { type: 'string' },
            subscriptionPlan:   { type: 'string' },
            subscriptionStatus: { type: 'string' },
            subscriptionSeats:  { type: 'integer' },
            createdAt:          { type: 'string', format: 'date-time' },
            updatedAt:          { type: 'string', format: 'date-time' },
          },
        },
        // ── Ticket ────────────────────────────────────────────────────────
        Ticket: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
            title:          { type: 'string' },
            description:    { type: 'string', nullable: true },
            status:         { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
            priority:       { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            assignedToId:   { type: 'string', format: 'uuid', nullable: true },
            customerId:     { type: 'string', format: 'uuid', nullable: true },
            applicationId:  { type: 'string', format: 'uuid', nullable: true },
            dueDate:        { type: 'string', format: 'date-time', nullable: true },
            estimatedHours: { type: 'number', nullable: true },
            actualHours:    { type: 'number', nullable: true },
            createdAt:      { type: 'string', format: 'date-time' },
            updatedAt:      { type: 'string', format: 'date-time' },
          },
        },
        // ── Customer ──────────────────────────────────────────────────────
        Customer: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            tenantId:  { type: 'string', format: 'uuid' },
            name:      { type: 'string' },
            email:     { type: 'string', format: 'email' },
            phone:     { type: 'string', nullable: true },
            address:   { type: 'string', nullable: true },
            company:   { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Application ───────────────────────────────────────────────────
        Application: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            tenantId:    { type: 'string', format: 'uuid' },
            name:        { type: 'string' },
            description: { type: 'string', nullable: true },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
          },
        },
        // ── Comment ───────────────────────────────────────────────────────
        Comment: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            ticketId:  { type: 'string', format: 'uuid' },
            userId:    { type: 'string', format: 'uuid' },
            content:   { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Notification ──────────────────────────────────────────────────
        Notification: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            userId:    { type: 'string', format: 'uuid' },
            message:   { type: 'string' },
            read:      { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Label ─────────────────────────────────────────────────────────
        Label: {
          type: 'object',
          properties: {
            id:    { type: 'string', format: 'uuid' },
            name:  { type: 'string' },
            color: { type: 'string', nullable: true },
          },
        },
        // ── Task ──────────────────────────────────────────────────────────
        Task: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            title:       { type: 'string' },
            description: { type: 'string', nullable: true },
            status:      { type: 'string' },
            boardId:     { type: 'string', format: 'uuid', nullable: true },
            columnId:    { type: 'string', format: 'uuid', nullable: true },
            position:    { type: 'integer' },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
          },
        },
        // ── Kanban Board ──────────────────────────────────────────────────
        Board: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            name:      { type: 'string' },
            tenantId:  { type: 'string', format: 'uuid', nullable: true },
            columns:   { type: 'array', items: { $ref: '#/components/schemas/Column' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Column: {
          type: 'object',
          properties: {
            id:       { type: 'string', format: 'uuid' },
            name:     { type: 'string' },
            position: { type: 'integer' },
            boardId:  { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    // Apply bearerAuth globally — individual operations can override with []
    security: [{ bearerAuth: [] }],
  },
  // Glob patterns for files that contain JSDoc @swagger annotations
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
