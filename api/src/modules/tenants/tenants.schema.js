import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  subscriptionPlan: text('subscription_plan').notNull().default('FREE'),
  subscriptionStatus: text('subscription_status').notNull().default('ACTIVE'),
  subscriptionStart: timestamp('subscription_start'),
  subscriptionEnd: timestamp('subscription_end'),
  subscriptionSeats: integer('subscription_seats').notNull().default(0),
  escalationIntervalMinutes: integer('escalation_interval_minutes').notNull().default(60),
  supportEmail: text('support_email'),
  slaUrgentHours: integer('sla_urgent_hours').notNull().default(4),
  slaHighHours: integer('sla_high_hours').notNull().default(8),
  slaMediumHours: integer('sla_medium_hours').notNull().default(24),
  slaLowHours: integer('sla_low_hours').notNull().default(72),
  epicAutoClose: boolean('epic_auto_close').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
