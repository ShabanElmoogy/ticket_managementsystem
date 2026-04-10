import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { epics } from '../epics/epics.schema.js';
import { users } from '../../users/users.schema.js';

export const epicActivity = pgTable('epic_activity', {
  id:        uuid('id').primaryKey().defaultRandom(),
  epicId:    uuid('epic_id').notNull().references(() => epics.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action:    text('action').notNull(),
  meta:      jsonb('meta').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});
