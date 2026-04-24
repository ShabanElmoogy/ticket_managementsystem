/**
 * attachments.validation.js
 * Zod schemas for attachment operations.
 */

import { z } from 'zod';

export const attachmentIdSchema = z.object({
  id:           z.string().uuid(),
  attachmentId: z.string().uuid(),
});

export const ticketIdSchema = z.object({
  id: z.string().uuid(),
});
