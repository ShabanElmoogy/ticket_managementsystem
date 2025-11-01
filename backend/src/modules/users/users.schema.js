import { pgTable, text, timestamp, pgEnum, boolean, integer, uuid } from 'drizzle-orm/pg-core';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'EMPLOYEE']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  phone: text('phone'),
  role: userRoleEnum('role').notNull().default('EMPLOYEE'),
  whatsappNotifications: boolean('whatsapp_notifications').default(false),
  reminderEnabled: boolean('reminder_enabled').default(true),
  reminderInterval: integer('reminder_interval').default(60), // in minutes
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});