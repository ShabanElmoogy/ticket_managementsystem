import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tickets } from '../tickets/tickets.schema.js';
import { tenants } from '../tenants/tenants.schema.js';

// Labels table
export const labels = pgTable('labels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#3B82F6'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Ticket labels junction table
export const ticketLabels = pgTable('ticket_labels', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  labelId: uuid('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow()
});