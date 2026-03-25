import { pgTable, text, timestamp, pgEnum, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE', 'PROGRAMMER']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
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