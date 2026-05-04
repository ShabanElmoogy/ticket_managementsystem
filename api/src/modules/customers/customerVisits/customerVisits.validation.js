import { z } from 'zod';

const visitStatus = z.enum(['PLANNED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);

export const createVisitSchema = z.object({
  status:    visitStatus.optional(),
  visitedAt: z.string().optional(),   // ISO datetime string
  notes:     z.string().max(2000).optional(),
  latitude:  z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const updateVisitSchema = z.object({
  status:    visitStatus.optional(),
  visitedAt: z.string().optional(),
  notes:     z.string().max(2000).nullable().optional(),
  latitude:  z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});
