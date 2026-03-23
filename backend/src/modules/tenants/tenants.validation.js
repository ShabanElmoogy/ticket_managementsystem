import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  subscriptionPlan: z.string().optional(),
  subscriptionStatus: z.string().optional(),
  subscriptionStart: z.string().datetime().nullable().optional(),
  subscriptionEnd: z.string().datetime().nullable().optional(),
  subscriptionSeats: z.number().int().min(0).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  subscriptionPlan: z.string().optional(),
  subscriptionStatus: z.string().optional(),
  subscriptionStart: z.string().datetime().nullable().optional(),
  subscriptionEnd: z.string().datetime().nullable().optional(),
  subscriptionSeats: z.number().int().min(0).optional(),
});
