import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';

// Comments table
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
  // Foreign keys
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id)
});