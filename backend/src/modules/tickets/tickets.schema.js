import { pgTable, text, timestamp, pgEnum, integer, real, uuid } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema.js';
import { customers } from '../customers/customers.schema.js';
import { applications } from '../applications/applications.schema.js';

// Ticket status enum
export const ticketStatusEnum = pgEnum('ticket_status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

// Ticket priority enum
export const ticketPriorityEnum = pgEnum('ticket_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Activity action enum
export const activityActionEnum = pgEnum('activity_action', ['CREATED', 'UPDATED', 'ASSIGNED', 'COMMENTED', 'STATUS_CHANGED', 'PRIORITY_CHANGED']);

// Tickets table
export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  status: ticketStatusEnum('status').notNull().default('OPEN'),
  priority: ticketPriorityEnum('priority').notNull().default('MEDIUM'),
  dueDate: timestamp('due_date'),
  estimatedHours: real('estimated_hours'),
  actualHours: real('actual_hours'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
  // Foreign keys
  customerId: uuid('customer_id').references(() => customers.id),
  applicationId: uuid('application_id').references(() => applications.id),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  boardId: uuid('board_id'), // Will reference kanban boards when created
  deletedAt: timestamp('deleted_at'),
});

// Ticket activities table
export const ticketActivities = pgTable('ticket_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: activityActionEnum('action').notNull(),
  description: text('description').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow(),
  
  // Foreign keys
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id)
});