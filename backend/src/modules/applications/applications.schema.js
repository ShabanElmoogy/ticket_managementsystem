import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Applications table
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});