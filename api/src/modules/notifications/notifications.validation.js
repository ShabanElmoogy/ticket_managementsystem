import { z } from 'zod';

export const notificationQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
});
