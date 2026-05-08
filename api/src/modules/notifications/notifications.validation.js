import { z } from 'zod';

export const notificationQuerySchema = z.object({
  limit:      z.coerce.number().int().min(1).max(500).optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
});
