import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Content is required').max(5000, 'Comment cannot exceed 5000 characters'),
});
