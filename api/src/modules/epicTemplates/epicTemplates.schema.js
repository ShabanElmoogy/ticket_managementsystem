import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';
import { users } from '../users/users.schema.js';

export const epicTemplates = pgTable('epic_templates', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  description: text('description'),
  category:    text('category').notNull().default('General'),
  // features: [{ title, description, steps: [{ title, description }] }]
  features:    jsonb('features').notNull().default([]),
  tenantId:    uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});
