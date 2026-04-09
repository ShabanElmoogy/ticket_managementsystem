import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { epics } from '../epics/epics.schema.js';
import { users } from '../users/users.schema.js';

export const epicComments = pgTable('epic_comments', {
  id:        uuid('id').primaryKey().defaultRandom(),
  content:   text('content').notNull(),
  epicId:    uuid('epic_id').notNull().references(() => epics.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
