import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';

export const ticketAttachments = pgTable('ticket_attachments', {
  id:           uuid('id').primaryKey().defaultRandom(),
  ticketId:     uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  uploadedById: uuid('uploaded_by_id').notNull().references(() => users.id),
  filename:     text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType:     text('mime_type').notNull(),
  size:         integer('size').notNull(),
  path:         text('path').notNull(),
  createdAt:    timestamp('created_at').defaultNow(),
});
