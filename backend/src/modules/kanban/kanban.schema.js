import { pgTable, text, timestamp, pgEnum, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema.js';

// Board type enum
export const boardTypeEnum = pgEnum('board_type', ['TICKETS', 'TASKS']);

// Permission role enum
export const permissionRoleEnum = pgEnum('permission_role', ['ADMIN', 'MEMBER', 'VIEWER']);

// Kanban boards table
export const kanbanBoards = pgTable('kanban_boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  type: boardTypeEnum('type').notNull().default('TICKETS'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Kanban columns table
export const kanbanColumns = pgTable('kanban_columns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#e3f2fd'),
  position: integer('position').notNull().default(0),
  wipLimit: integer('wip_limit'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
  // Foreign keys
  boardId: uuid('board_id').notNull().references(() => kanbanBoards.id, { onDelete: 'cascade' })
});

// Board permissions table
export const boardPermissions = pgTable('board_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: permissionRoleEnum('role').notNull().default('MEMBER'),
  createdAt: timestamp('created_at').defaultNow(),
  
  // Foreign keys
  boardId: uuid('board_id').notNull().references(() => kanbanBoards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' })
});

