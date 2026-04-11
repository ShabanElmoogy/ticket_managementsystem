import { pgTable, text, timestamp, pgEnum, uuid, date, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../../users/users.schema.js';
import { tenants } from '../../tenants/tenants.schema.js';
import { applications } from '../../applications/applications.schema.js';
import { customers } from '../../customers/customers.schema.js';

export const epicStatusEnum = pgEnum('epic_status', [
  'DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED',
]);

export const epicPriorityEnum = pgEnum('epic_priority', [
  'LOW', 'MEDIUM', 'HIGH', 'CRITICAL',
]);

export const epics = pgTable('epics', {
  id:            uuid('id').primaryKey().defaultRandom(),
  title:         text('title').notNull(),
  description:   text('description'),
  status:        epicStatusEnum('status').notNull().default('DRAFT'),
  tenantId:      uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  ownerId:       uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'set null' }),
  customerId:    uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  parentEpicId:  uuid('parent_epic_id'),  // self-reference added after table definition
  priority:      epicPriorityEnum('priority').notNull().default('MEDIUM'),
  tags:          text('tags').array().notNull().default(sql`'{}'::text[]`),
  targetDate:    date('target_date'),
  estimatedDays: integer('estimated_days'),
  createdAt:     timestamp('created_at').defaultNow(),
  updatedAt:     timestamp('updated_at').defaultNow(),
});

// epicId is blocked by blockerId
export const epicDependencies = pgTable('epic_dependencies', {
  epicId:    uuid('epic_id').notNull().references(() => epics.id, { onDelete: 'cascade' }),
  blockerId: uuid('blocker_id').notNull().references(() => epics.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const epicRelationTypeEnum = pgEnum('epic_relation_type', [
  'RELATES_TO',
  'DUPLICATES',
  'DEPENDS_ON',
  'SPLIT_FROM',
]);

// Soft relations between epics (non-blocking)
export const epicRelations = pgTable('epic_relations', {
  id:           uuid('id').primaryKey().defaultRandom(),
  sourceEpicId: uuid('source_epic_id').notNull().references(() => epics.id, { onDelete: 'cascade' }),
  targetEpicId: uuid('target_epic_id').notNull().references(() => epics.id, { onDelete: 'cascade' }),
  relationType: epicRelationTypeEnum('relation_type').notNull().default('RELATES_TO'),
  createdAt:    timestamp('created_at').defaultNow(),
});
