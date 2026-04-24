import { z } from 'zod';

export const createEpicCommentSchema = z.object({
  content: z.string().trim().min(1, 'content is required').max(5000),
});
