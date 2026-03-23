/**
 * OpenAPI 3 reusable components.
 * Imported by swagger.js — never referenced directly by route files.
 */

// ── Shared primitives ──────────────────────────────────────────────────────────
const UuidParam = (name, description) => ({
  in: 'path',
  name,
  required: true,
  description,
  schema: { type: 'string', format: 'uuid' },
});

const ArrayOf = (ref) => ({ type: 'array', items: { $ref: ref } });

const JsonBody = (schema) => ({
  required: true,
  content: { 'application/json': { schema } },
});

// ── Exported components object ─────────────────────────────────────────────────
export const components = {
  securitySchemes: {
    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
  },

  // ── Parameters ──────────────────────────────────────────────────────────────
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
    PathId:            UuidParam('id', 'Resource UUID'),
    PathBoardId:       UuidParam('boardId', 'Board UUID'),
    PathColumnId:      UuidParam('columnId', 'Column UUID'),
    PathTicketId:      UuidParam('ticketId', 'Ticket UUID'),
    PathTaskId:        UuidParam('taskId', 'Task UUID'),
    PathApplicationId: UuidParam('applicationId', 'Application UUID'),
    PathCustomerId:    UuidParam('customerId', 'Customer UUID'),
    PathLabelId:       UuidParam('labelId', 'Label UUID'),
  },

  // ── Responses ───────────────────────────────────────────────────────────────
  responses: {
    NoContent:    { description: 'Success' },
    Unauthorized: { description: 'Missing or invalid token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    Forbidden:    { description: 'Insufficient permissions', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    NotFound:     { description: 'Resource not found',       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    BadRequest:   { description: 'Validation error',         content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },

    // Entity responses
    User:         { description: 'User object',         content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
    UserList:     { description: 'Array of users',      content: { 'application/json': { schema: ArrayOf('#/components/schemas/User') } } },
    Tenant:       { description: 'Tenant object',       content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
    TenantList:   { description: 'Array of tenants',    content: { 'application/json': { schema: ArrayOf('#/components/schemas/Tenant') } } },
    Ticket:       { description: 'Ticket object',       content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } } },
    TicketList:   { description: 'Array of tickets',    content: { 'application/json': { schema: ArrayOf('#/components/schemas/Ticket') } } },
    Customer:     { description: 'Customer object',     content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } } },
    CustomerList: { description: 'Array of customers',  content: { 'application/json': { schema: ArrayOf('#/components/schemas/Customer') } } },
    Application:  { description: 'Application object',  content: { 'application/json': { schema: { $ref: '#/components/schemas/Application' } } } },
    ApplicationList: { description: 'Array of applications', content: { 'application/json': { schema: ArrayOf('#/components/schemas/Application') } } },
    Comment:      { description: 'Comment object',      content: { 'application/json': { schema: { $ref: '#/components/schemas/Comment' } } } },
    Notification: { description: 'Notification object', content: { 'application/json': { schema: { $ref: '#/components/schemas/Notification' } } } },
    NotificationList: { description: 'Array of notifications', content: { 'application/json': { schema: ArrayOf('#/components/schemas/Notification') } } },
    Label:        { description: 'Label object',        content: { 'application/json': { schema: { $ref: '#/components/schemas/Label' } } } },
    LabelList:    { description: 'Array of labels',     content: { 'application/json': { schema: ArrayOf('#/components/schemas/Label') } } },
    Task:         { description: 'Task object',         content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
    TaskList:     { description: 'Array of tasks',      content: { 'application/json': { schema: ArrayOf('#/components/schemas/Task') } } },
    Board:        { description: 'Board object',        content: { 'application/json': { schema: { $ref: '#/components/schemas/Board' } } } },
    BoardList:    { description: 'Array of boards',     content: { 'application/json': { schema: ArrayOf('#/components/schemas/Board') } } },
    Column:       { description: 'Column object',       content: { 'application/json': { schema: { $ref: '#/components/schemas/Column' } } } },
    AuthResponse: { description: 'Authenticated',       content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
  },

  // ── Request Bodies ───────────────────────────────────────────────────────────
  requestBodies: {
    CreateApplication: JsonBody({
      type: 'object', required: ['name'],
      properties: { name: { type: 'string' }, description: { type: 'string' } },
    }),
    UpdateApplication: JsonBody({
      type: 'object',
      properties: { name: { type: 'string' }, description: { type: 'string' } },
    }),
    AssignCustomerToApp: JsonBody({
      type: 'object', required: ['applicationId', 'customerId'],
      properties: {
        applicationId: { type: 'string', format: 'uuid' },
        customerId:    { type: 'string', format: 'uuid' },
      },
    }),
    CreateCustomer: JsonBody({
      type: 'object', required: ['name', 'email'],
      properties: {
        name:    { type: 'string' },
        email:   { type: 'string', format: 'email' },
        phone:   { type: 'string', nullable: true },
        address: { type: 'string', nullable: true },
        company: { type: 'string', nullable: true },
      },
    }),
    UpdateCustomer: JsonBody({
      type: 'object',
      properties: {
        name:    { type: 'string' },
        email:   { type: 'string', format: 'email' },
        phone:   { type: 'string', nullable: true },
        address: { type: 'string', nullable: true },
        company: { type: 'string', nullable: true },
      },
    }),
    AssignApplicationToCustomer: JsonBody({
      type: 'object', required: ['customerId', 'applicationId'],
      properties: {
        customerId:    { type: 'string', format: 'uuid' },
        applicationId: { type: 'string', format: 'uuid' },
      },
    }),
    CreateTicket: JsonBody({
      type: 'object', required: ['title'],
      properties: {
        title:          { type: 'string' },
        description:    { type: 'string' },
        priority:       { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        assignedToId:   { type: 'string', format: 'uuid', nullable: true },
        customerId:     { type: 'string', format: 'uuid', nullable: true },
        applicationId:  { type: 'string', format: 'uuid', nullable: true },
        dueDate:        { type: 'string', format: 'date-time', nullable: true },
        estimatedHours: { type: 'number', nullable: true },
      },
    }),
    UpdateTicket: JsonBody({
      type: 'object',
      properties: {
        title:        { type: 'string' },
        status:       { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
        priority:     { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        assignedToId: { type: 'string', format: 'uuid', nullable: true },
        dueDate:      { type: 'string', format: 'date-time', nullable: true },
        actualHours:  { type: 'number', nullable: true },
      },
    }),
    CreateTenantUser: JsonBody({
      type: 'object', required: ['email', 'name', 'password'],
      properties: {
        email:    { type: 'string', format: 'email' },
        name:     { type: 'string' },
        password: { type: 'string', minLength: 6 },
        role:     { type: 'string', enum: ['TENANT_ADMIN', 'EMPLOYEE'] },
        phone:    { type: 'string' },
      },
    }),
    UpdateOwnProfile: JsonBody({
      type: 'object',
      properties: {
        name:             { type: 'string' },
        email:            { type: 'string', format: 'email' },
        phone:            { type: 'string', nullable: true },
        reminderEnabled:  { type: 'boolean' },
        reminderInterval: { type: 'integer' },
      },
    }),
    UpdateUser: JsonBody({
      type: 'object',
      properties: {
        name:  { type: 'string' },
        email: { type: 'string', format: 'email' },
        role:  { type: 'string', enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE'] },
      },
    }),
    CreateTenant: JsonBody({
      type: 'object', required: ['name'],
      properties: {
        name:               { type: 'string' },
        slug:               { type: 'string' },
        subscriptionPlan:   { type: 'string' },
        subscriptionStatus: { type: 'string' },
        subscriptionSeats:  { type: 'integer' },
      },
    }),
    UpdateTenant: JsonBody({
      type: 'object',
      properties: {
        name:               { type: 'string' },
        slug:               { type: 'string' },
        subscriptionPlan:   { type: 'string' },
        subscriptionStatus: { type: 'string' },
        subscriptionSeats:  { type: 'integer' },
      },
    }),
    CreateComment: JsonBody({
      type: 'object', required: ['content'],
      properties: { content: { type: 'string' } },
    }),
    CreateLabel: JsonBody({
      type: 'object', required: ['name'],
      properties: { name: { type: 'string' }, color: { type: 'string' } },
    }),
    UpdateLabel: JsonBody({
      type: 'object',
      properties: { name: { type: 'string' }, color: { type: 'string' } },
    }),
    AssignLabel: JsonBody({
      type: 'object', required: ['labelId', 'ticketId'],
      properties: {
        labelId:  { type: 'string', format: 'uuid' },
        ticketId: { type: 'string', format: 'uuid' },
      },
    }),
    CreateTask: JsonBody({
      type: 'object', required: ['title'],
      properties: {
        title:       { type: 'string' },
        description: { type: 'string' },
        boardId:     { type: 'string', format: 'uuid' },
        columnId:    { type: 'string', format: 'uuid' },
      },
    }),
    UpdateTask: JsonBody({
      type: 'object',
      properties: {
        title:       { type: 'string' },
        description: { type: 'string' },
        status:      { type: 'string' },
      },
    }),
    MoveItem: JsonBody({
      type: 'object',
      properties: {
        columnId: { type: 'string', format: 'uuid' },
        position: { type: 'integer' },
      },
    }),
    CreateBoard: JsonBody({
      type: 'object', required: ['name'],
      properties: { name: { type: 'string' } },
    }),
    UpdateBoard: JsonBody({
      type: 'object',
      properties: { name: { type: 'string' } },
    }),
    AddColumn: JsonBody({
      type: 'object', required: ['name'],
      properties: { name: { type: 'string' }, position: { type: 'integer' } },
    }),
    UpdateColumn: JsonBody({
      type: 'object',
      properties: { name: { type: 'string' }, position: { type: 'integer' } },
    }),
    UpdateReminderSettings: JsonBody({
      type: 'object',
      properties: {
        reminderEnabled:  { type: 'boolean' },
        reminderInterval: { type: 'integer' },
      },
    }),
    RefreshToken: JsonBody({
      type: 'object', required: ['refreshToken'],
      properties: { refreshToken: { type: 'string' } },
    }),
    Logout: JsonBody({
      type: 'object',
      properties: { refreshToken: { type: 'string' } },
    }),
  },

  // ── Schemas ──────────────────────────────────────────────────────────────────
  schemas: {
    Error: {
      type: 'object',
      properties: { error: { type: 'string', example: 'Not found' } },
    },
    RegisterRequest: {
      type: 'object', required: ['email', 'name', 'password'],
      properties: {
        email:    { type: 'string', format: 'email' },
        name:     { type: 'string', minLength: 1 },
        password: { type: 'string', minLength: 6 },
        role:     { type: 'string', enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE'] },
      },
    },
    LoginRequest: {
      type: 'object', required: ['email', 'password'],
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
    User: {
      type: 'object',
      properties: {
        id:                    { type: 'string', format: 'uuid' },
        tenantId:              { type: 'string', format: 'uuid', nullable: true },
        email:                 { type: 'string', format: 'email' },
        name:                  { type: 'string' },
        role:                  { type: 'string', enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE'] },
        phone:                 { type: 'string', nullable: true },
        whatsappNotifications: { type: 'boolean' },
        reminderEnabled:       { type: 'boolean' },
        reminderInterval:      { type: 'integer' },
        createdAt:             { type: 'string', format: 'date-time' },
        updatedAt:             { type: 'string', format: 'date-time' },
      },
    },
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
    Label: {
      type: 'object',
      properties: {
        id:    { type: 'string', format: 'uuid' },
        name:  { type: 'string' },
        color: { type: 'string', nullable: true },
      },
    },
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
    ReminderSettings: {
      type: 'object',
      properties: {
        reminderEnabled:  { type: 'boolean' },
        reminderInterval: { type: 'integer', description: 'Interval in minutes' },
      },
    },
    NotificationCount: {
      type: 'object',
      properties: { count: { type: 'integer' } },
    },
  },
};
