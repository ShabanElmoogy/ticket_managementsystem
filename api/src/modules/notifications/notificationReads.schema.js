import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { notifications } from './notifications.schema.js';
import { users } from '../users/users.schema.js';

/**
 * notification_reads — per-user read receipts for notifications.
 *
 * One row = "this user has read this notification".
 * Absence of a row = unread for that user.
 *
 * This allows each user to have independent read/unread state
 * for the same tenant-wide notification.
 */
export const notificationReads = pgTable('notification_reads', {
  notificationId: uuid('notification_id').notNull().references(() => notifications.id, { onDelete: 'cascade' }),
  userId:         uuid('user_id').notNull().references(() => users.id,         { onDelete: 'cascade' }),
  readAt:         timestamp('read_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.notificationId, t.userId] }),
}));
