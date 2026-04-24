import { z } from 'zod';

export const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});
