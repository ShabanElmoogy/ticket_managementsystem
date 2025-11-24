import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema.js';
import { kanbanBoards, kanbanColumns } from '../kanban/kanban.schema.js';

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('TODO'),
  priority: text('priority').notNull().default('MEDIUM'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  dueDate: timestamp('due_date'),
  
  // Foreign keys
  boardId: uuid('board_id').notNull().references(() => kanbanBoards.id, { onDelete: 'cascade' }),
  columnId: uuid('column_id').references(() => kanbanColumns.id),
  assigneeId: uuid('assignee_id').references(() => users.id)
});