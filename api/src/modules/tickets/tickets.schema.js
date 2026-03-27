import { pgTable, text, timestamp, pgEnum, integer, real, uuid, jsonb } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema.js';
import { customers } from '../customers/customers.schema.js';
import { applications } from '../applications/applications.schema.js';
import { tenants } from '../tenants/tenants.schema.js';

// Ticket status enum
export const ticketStatusEnum = pgEnum('ticket_status', [
  'OPEN', 'IN_PROGRESS', 'PROGRAMMING', 'UNDER_DEVELOPMENT',
  'CODE_REVIEW', 'TESTING', 'RESOLVED', 'CLOSED'
]);

// Ticket priority enum
export const ticketPriorityEnum = pgEnum('ticket_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Activity action enum
export const activityActionEnum = pgEnum('activity_action', [
  'CREATED', 'UPDATED', 'ASSIGNED', 'COMMENTED', 'STATUS_CHANGED',
  'PRIORITY_CHANGED', 'DELETED', 'RESTORED', 'COMMENT_DELETED',
  'PROGRAMMER_ASSIGNED', 'PROGRAMMING_UPDATED', 'REASSIGNED'
]);

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
  programmerId: uuid('programmer_id').references(() => users.id),
  boardId: uuid('board_id'),
  deletedAt: timestamp('deleted_at'),
  lastEscalatedAt: timestamp('last_escalated_at'),
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

// Programming details table (one-to-one with ticket)
export const programmingDetails = pgTable('programming_details', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  ticketId:             uuid('ticket_id').notNull().unique().references(() => tickets.id, { onDelete: 'cascade' }),
  tenantId:             uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  programmerId:         uuid('programmer_id').references(() => users.id),
  technicalDescription: text('technical_description'),
  rootCause:            text('root_cause'),
  stepsToReproduce:     text('steps_to_reproduce'),
  solutionSteps:        jsonb('solution_steps').default([]),
  codeSnippets:         jsonb('code_snippets').default([]),
  attachments:          jsonb('attachments').default([]),
  estimatedHours:       real('estimated_hours'),
  actualHours:          real('actual_hours'),
  createdAt:            timestamp('created_at').defaultNow(),
  updatedAt:            timestamp('updated_at').defaultNow(),
});