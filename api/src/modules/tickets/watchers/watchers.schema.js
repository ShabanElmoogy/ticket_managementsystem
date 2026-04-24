import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { tickets } from '../tickets.schema.js';
import { users } from '../../users/users.schema.js';

export const ticketWatchers = pgTable('ticket_watchers', {
  id:        uuid('id').primaryKey().defaultRandom(),
  ticketId:  uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [unique().on(t.ticketId, t.userId)]);
