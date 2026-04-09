import { pgTable, text, timestamp, pgEnum, uuid, date } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { applications } from '../applications/applications.schema.js';
import { customers } from '../customers/customers.schema.js';

export const epicStatusEnum = pgEnum('epic_status', [
  'DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED',
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
  targetDate:    date('target_date'),
  createdAt:     timestamp('created_at').defaultNow(),
  updatedAt:     timestamp('updated_at').defaultNow(),
});
