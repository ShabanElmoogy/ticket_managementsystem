import { z } from 'zod';

export const deleteMediaSchema = z.object({
  url: z.string().trim().min(1, 'url is required').startsWith('/uploads/', 'url must start with /uploads/'),
});
