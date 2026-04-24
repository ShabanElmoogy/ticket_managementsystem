import { z } from 'zod';

export const notificationQuerySchema = z.object({
  limit:      z.coerce.number().int().min(1).max(200).optional().default(50),
  unreadOnly: z.enum(['true', 'false']).optional(),
});
