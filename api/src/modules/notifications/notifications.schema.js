import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { tenants } from '../tenants/tenants.schema.js';

// Notifications table
export const notifications = pgTable('notifications', {
  id:        uuid('id').primaryKey().defaultRandom(),
  title:     text('title').notNull(),
  message:   text('message').notNull(),
  type:      text('type').notNull(),
  isRead:    boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),

  // Foreign keys
  userId:   uuid('user_id').notNull().references(() => users.id,   { onDelete: 'cascade' }),
  ticketId: uuid('ticket_id').references(() => tickets.id,         { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id,         { onDelete: 'cascade' }),
});