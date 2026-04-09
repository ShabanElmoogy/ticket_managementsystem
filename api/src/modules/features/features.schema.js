import { pgTable, text, timestamp, pgEnum, uuid, unique, integer } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { applications } from '../applications/applications.schema.js';
import { customers } from '../customers/customers.schema.js';

export const featureStatusEnum = pgEnum('feature_status', [
  'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED',
]);

export const featureRequests = pgTable('feature_requests', {
  id:             uuid('id').primaryKey().defaultRandom(),
  title:          text('title').notNull(),
  description:    text('description').notNull(),
  status:         featureStatusEnum('status').notNull().default('UNDER_REVIEW'),
  tenantId:       uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  submittedById:  uuid('submitted_by_id').notNull().references(() => users.id),
  linkedTicketId:  uuid('linked_ticket_id').references(() => tickets.id, { onDelete: 'set null' }),
  applicationId:   uuid('application_id').references(() => applications.id, { onDelete: 'set null' }),
  customerId:      uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  epicId:          uuid('epic_id'),
  epicOrder:       integer('epic_order').notNull().default(0),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:      timestamp('updated_at').defaultNow(),
});

export const featureStepStatusEnum = pgEnum('feature_step_status', [
  'TODO', 'IN_PROGRESS', 'DONE',
]);

export const featureSteps = pgTable('feature_steps', {
  id:                uuid('id').primaryKey().defaultRandom(),
  featureRequestId:  uuid('feature_request_id').notNull().references(() => featureRequests.id, { onDelete: 'cascade' }),
  title:             text('title').notNull(),
  description:       text('description'),
  order:             integer('order').notNull().default(0),
  status:            featureStepStatusEnum('status').notNull().default('TODO'),
  assignedToId:      uuid('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),
  assignedProgrammerId: uuid('assigned_programmer_id').references(() => users.id, { onDelete: 'set null' }),
  linkedTicketId:    uuid('linked_ticket_id').references(() => tickets.id, { onDelete: 'set null' }),
  createdAt:         timestamp('created_at').defaultNow(),
  updatedAt:         timestamp('updated_at').defaultNow(),
});

export const featureVotes = pgTable('feature_votes', {
  id:               uuid('id').primaryKey().defaultRandom(),
  featureRequestId: uuid('feature_request_id').notNull().references(() => featureRequests.id, { onDelete: 'cascade' }),
  userId:           uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt:        timestamp('created_at').defaultNow(),
}, (t) => [unique().on(t.featureRequestId, t.userId)]);
