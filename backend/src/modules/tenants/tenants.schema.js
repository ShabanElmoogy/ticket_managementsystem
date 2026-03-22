import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Tenants table
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),

  // Subscription
  subscriptionPlan: text('subscription_plan').notNull().default('FREE'),
  subscriptionStatus: text('subscription_status').notNull().default('ACTIVE'),
  subscriptionStart: timestamp('subscription_start'),
  subscriptionEnd: timestamp('subscription_end'),
  subscriptionSeats: integer('subscription_seats').notNull().default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
