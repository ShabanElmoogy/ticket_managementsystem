import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../users/users.schema.js';

/**
 * push_tokens table
 * Stores Expo Push Tokens per user per device.
 * One user may have multiple tokens (multiple devices).
 * Token is unique — prevents duplicate registrations for the same device.
 */
export const pushTokens = pgTable('push_tokens', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  platform:  text('platform').notNull(), // 'ios' | 'android'
  createdAt: timestamp('created_at').defaultNow(),
});
