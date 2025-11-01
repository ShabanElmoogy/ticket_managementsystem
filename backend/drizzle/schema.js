import { pgTable, varchar, text, integer, boolean, timestamp, real, pgEnum, index, uniqueIndex, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'EMPLOYEE']);
export const ticketStatusEnum = pgEnum('ticket_status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const activityActionEnum = pgEnum('activity_action', ['CREATED', 'UPDATED', 'ASSIGNED', 'COMMENTED', 'STATUS_CHANGED', 'PRIORITY_CHANGED']);
export const permissionRoleEnum = pgEnum('permission_role', ['ADMIN', 'MEMBER', 'VIEWER']);
export const boardTypeEnum = pgEnum('board_type', ['TICKETS', 'TASKS']);
export const taskStatusEnum = pgEnum('task_status', ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']);
export const notificationTypeEnum = pgEnum('notification_type', ['TICKET_ASSIGNED', 'TICKET_UPDATED', 'TICKET_COMMENTED', 'TICKET_DUE_SOON', 'TICKET_OVERDUE', 'MENTION', 'STATUS_CHANGED']);
export const docNodeTypeEnum = pgEnum('doc_node_type', ['FOLDER', 'DOC']);

// Tables
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 191 }).unique().notNull(),
  name: varchar('name', { length: 191 }).notNull(),
  password: varchar('password', { length: 191 }).notNull(),
  phone: varchar('phone', { length: 191 }),
  role: userRoleEnum('role').default('EMPLOYEE').notNull(),
  whatsappNotifications: boolean('whatsapp_notifications').default(true),
  reminderEnabled: boolean('reminder_enabled').default(true),
  reminderInterval: integer('reminder_interval').default(60).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

export const refreshTokens = pgTable('refresh_tokens', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: varchar('token', { length: 500 }).notNull(),
  userId: varchar('user_id', { length: 191 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex('refresh_tokens_token_idx').on(table.token),
  userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
  expiresAtIdx: index('refresh_tokens_expires_at_idx').on(table.expiresAt),
  revokedAtIdx: index('refresh_tokens_revoked_at_idx').on(table.revokedAt),
}));

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 191 }).notNull(),
  email: varchar('email', { length: 191 }).unique().notNull(),
  phone: varchar('phone', { length: 191 }),
  address: text('address'),
  company: text('company'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('customers_email_idx').on(table.email),
}));

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
  version: varchar('version', { length: 191 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customerApplications = pgTable('customer_applications', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: varchar('customer_id', { length: 191 }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  applicationId: varchar('application_id', { length: 191 }).notNull().references(() => applications.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => ({
  customerApplicationIdx: uniqueIndex('customer_applications_customer_id_application_id_idx').on(table.customerId, table.applicationId),
}));

export const kanbanBoards = pgTable('kanban_boards', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  type: boardTypeEnum('type').default('TICKETS').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const kanbanColumns = pgTable('kanban_columns', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }),
  position: integer('position').notNull(),
  wipLimit: integer('wip_limit'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  boardId: varchar('board_id', { length: 191 }).notNull().references(() => kanbanBoards.id, { onDelete: 'cascade' }),
}, (table) => ({
  boardIdPositionIdx: uniqueIndex('kanban_columns_board_id_position_idx').on(table.boardId, table.position),
}));

export const tickets = pgTable('tickets', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 191 }).notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('status').default('OPEN').notNull(),
  priority: ticketPriorityEnum('priority').default('MEDIUM').notNull(),
  dueDate: timestamp('due_date'),
  estimatedHours: real('estimated_hours'),
  actualHours: real('actual_hours'),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  assignedToId: varchar('assigned_to_id', { length: 191 }).references(() => users.id),
  createdById: varchar('created_by_id', { length: 191 }).notNull().references(() => users.id),
  customerId: varchar('customer_id', { length: 191 }).references(() => customers.id),
  applicationId: varchar('application_id', { length: 191 }).references(() => applications.id),
  boardId: varchar('board_id', { length: 191 }).references(() => kanbanBoards.id),
});

export const tasks = pgTable('tasks', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 191 }).notNull(),
  description: text('description').notNull(),
  status: taskStatusEnum('status').default('TODO').notNull(),
  dueDate: timestamp('due_date'),
  assigneeId: varchar('assignee_id', { length: 191 }).references(() => users.id),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  boardId: varchar('board_id', { length: 191 }).notNull().references(() => kanbanBoards.id),
  columnId: varchar('column_id', { length: 191 }).references(() => kanbanColumns.id),
});

export const comments = pgTable('comments', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  ticketId: varchar('ticket_id', { length: 191 }).notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 191 }).notNull().references(() => users.id),
});

export const labels = pgTable('labels', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 191 }).unique().notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('labels_name_idx').on(table.name),
}));

export const ticketLabels = pgTable('ticket_labels', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketId: varchar('ticket_id', { length: 191 }).notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  labelId: varchar('label_id', { length: 191 }).notNull().references(() => labels.id, { onDelete: 'cascade' }),
}, (table) => ({
  ticketLabelIdx: uniqueIndex('ticket_labels_ticket_id_label_id_idx').on(table.ticketId, table.labelId),
}));

export const ticketActivities = pgTable('ticket_activities', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  action: activityActionEnum('action').notNull(),
  description: text('description').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  ticketId: varchar('ticket_id', { length: 191 }).notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 191 }).notNull().references(() => users.id),
});

export const boardPermissions = pgTable('board_permissions', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 191 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  boardId: varchar('board_id', { length: 191 }).notNull().references(() => kanbanBoards.id, { onDelete: 'cascade' }),
  role: permissionRoleEnum('role').notNull(),
}, (table) => ({
  userBoardIdx: uniqueIndex('board_permissions_user_id_board_id_idx').on(table.userId, table.boardId),
}));

export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 191 }).notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: varchar('user_id', { length: 191 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  ticketId: varchar('ticket_id', { length: 191 }).references(() => tickets.id, { onDelete: 'cascade' }),
});

export const docs = pgTable('docs', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 191 }).notNull(),
  blocks: text('blocks').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const docNodes = pgTable('doc_nodes', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: docNodeTypeEnum('type').notNull(),
  title: varchar('title', { length: 191 }).notNull(),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  parentId: varchar('parent_id', { length: 191 }).references(() => docNodes.id, { onDelete: 'cascade' }),
  docId: varchar('doc_id', { length: 191 }).references(() => docs.id, { onDelete: 'cascade' }),
}, (table) => ({
  parentIdPositionIdx: index('doc_nodes_parent_id_position_idx').on(table.parentId, table.position),
}));

// Relations (same as before)
export const usersRelations = relations(users, ({ many }) => ({
  assignedTickets: many(tickets, { relationName: 'assignedTo' }),
  assignedTasks: many(tasks, { relationName: 'assignedTasks' }),
  createdTickets: many(tickets, { relationName: 'createdBy' }),
  comments: many(comments),
  activities: many(ticketActivities),
  boardPermissions: many(boardPermissions),
  notifications: many(notifications),
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  applications: many(customerApplications),
  tickets: many(tickets),
}));

export const applicationsRelations = relations(applications, ({ many }) => ({
  customers: many(customerApplications),
  tickets: many(tickets),
}));

export const customerApplicationsRelations = relations(customerApplications, ({ one }) => ({
  customer: one(customers, {
    fields: [customerApplications.customerId],
    references: [customers.id],
  }),
  application: one(applications, {
    fields: [customerApplications.applicationId],
    references: [applications.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [tickets.createdById],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [tickets.customerId],
    references: [customers.id],
  }),
  application: one(applications, {
    fields: [tickets.applicationId],
    references: [applications.id],
  }),
  board: one(kanbanBoards, {
    fields: [tickets.boardId],
    references: [kanbanBoards.id],
  }),
  comments: many(comments),
  labels: many(ticketLabels),
  activities: many(ticketActivities),
  notifications: many(notifications),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const kanbanBoardsRelations = relations(kanbanBoards, ({ many }) => ({
  columns: many(kanbanColumns),
  tickets: many(tickets),
  tasks: many(tasks),
  permissions: many(boardPermissions),
}));

export const kanbanColumnsRelations = relations(kanbanColumns, ({ one, many }) => ({
  board: one(kanbanBoards, {
    fields: [kanbanColumns.boardId],
    references: [kanbanBoards.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: 'assignedTasks',
  }),
  board: one(kanbanBoards, {
    fields: [tasks.boardId],
    references: [kanbanBoards.id],
  }),
  column: one(kanbanColumns, {
    fields: [tasks.columnId],
    references: [kanbanColumns.id],
  }),
}));

export const labelsRelations = relations(labels, ({ many }) => ({
  tickets: many(ticketLabels),
}));

export const ticketLabelsRelations = relations(ticketLabels, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketLabels.ticketId],
    references: [tickets.id],
  }),
  label: one(labels, {
    fields: [ticketLabels.labelId],
    references: [labels.id],
  }),
}));

export const ticketActivitiesRelations = relations(ticketActivities, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketActivities.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketActivities.userId],
    references: [users.id],
  }),
}));

export const boardPermissionsRelations = relations(boardPermissions, ({ one }) => ({
  user: one(users, {
    fields: [boardPermissions.userId],
    references: [users.id],
  }),
  board: one(kanbanBoards, {
    fields: [boardPermissions.boardId],
    references: [kanbanBoards.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  ticket: one(tickets, {
    fields: [notifications.ticketId],
    references: [tickets.id],
  }),
}));

export const docsRelations = relations(docs, ({ many }) => ({
  nodes: many(docNodes),
}));

export const docNodesRelations = relations(docNodes, ({ one, many }) => ({
  parent: one(docNodes, {
    fields: [docNodes.parentId],
    references: [docNodes.id],
    relationName: 'parentChildren',
  }),
  children: many(docNodes, { relationName: 'parentChildren' }),
  doc: one(docs, {
    fields: [docNodes.docId],
    references: [docs.id],
  }),
}));