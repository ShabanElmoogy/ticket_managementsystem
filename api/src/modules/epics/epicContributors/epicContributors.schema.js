import { pgTable, text, timestamp, uuid, unique } from 'drizzle-orm/pg-core';
import { epics } from '../epics/epics.schema.js';
import { users } from '../../users/users.schema.js';

// Valid contributor roles
export const CONTRIBUTOR_ROLES = [
  'PM', 'TECH_LEAD', 'DESIGNER', 'DEVELOPER', 'QA', 'DEVOPS', 'ANALYST', 'STAKEHOLDER', 'OTHER',
];

export const epicContributors = pgTable('epic_contributors', {
  id:        uuid('id').primaryKey().defaultRandom(),
  epicId:    uuid('epic_id').notNull().references(() => epics.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role:      text('role').notNull().default('OTHER'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [unique().on(t.epicId, t.userId)]);
