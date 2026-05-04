import { pgTable, text, timestamp, uuid, doublePrecision, pgEnum } from 'drizzle-orm/pg-core';
import { customers } from '../customers.schema.js';
import { users } from '../../users/users.schema.js';

export const visitStatusEnum = pgEnum('visit_status', [
  'PLANNED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

export const customerVisits = pgTable('customer_visits', {
  id:          uuid('id').primaryKey().defaultRandom(),
  customerId:  uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status:      visitStatusEnum('status').notNull().default('PLANNED'),
  visitedAt:   timestamp('visited_at').notNull().defaultNow(),
  notes:       text('notes'),
  // GPS coordinates captured at time of visit (may differ from customer's stored location)
  latitude:    doublePrecision('latitude'),
  longitude:   doublePrecision('longitude'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});
