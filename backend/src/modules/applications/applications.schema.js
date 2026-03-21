import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';

// Applications table
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});