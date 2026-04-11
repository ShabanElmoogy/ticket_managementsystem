import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { epics } from '../epics/epics.schema.js';
import { users } from '../../users/users.schema.js';

export const epicWatchers = pgTable('epic_watchers', {
  id:        uuid('id').primaryKey().defaultRandom(),
  epicId:    uuid('epic_id').notNull().references(() => epics.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [unique().on(t.epicId, t.userId)]);
