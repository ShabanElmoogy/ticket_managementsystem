import { pgTable, text, timestamp, pgEnum, boolean, integer, uuid } from 'drizzle-orm/pg-core';

import { users } from '../users/users.schema.js';

// Refresh tokens table
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow()
});