import { pgTable, text, real, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema.js';
import { tenants } from '../tenants/tenants.schema.js';

export const ticketTemplates = pgTable('ticket_templates', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  name:           text('name').notNull(),
  description:    text('description'),
  priority:       text('priority').notNull().default('MEDIUM'),
  estimatedHours: real('estimated_hours'),
  createdById:    uuid('created_by_id').notNull().references(() => users.id),
  createdAt:      timestamp('created_at').defaultNow(),
  updatedAt:      timestamp('updated_at').defaultNow(),
});
