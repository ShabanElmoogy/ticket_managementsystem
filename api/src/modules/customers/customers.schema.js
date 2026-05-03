import { pgTable, text, timestamp, uuid, pgEnum, doublePrecision } from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';

export const maintenanceTypeEnum = pgEnum('maintenance_type', [
  'MONTHLY_SUBSCRIPTION',
  'FREE_TRIAL',
  'PAY_AS_YOU_GO',
]);

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  address: text('address'),
  maintenanceType: maintenanceTypeEnum('maintenance_type'),
  subscriptionStartDate: timestamp('subscription_start_date'),
  subscriptionEndDate: timestamp('subscription_end_date'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Customer-Application join table
export const customerApplications = pgTable('customer_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow()
});