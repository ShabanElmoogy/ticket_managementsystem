import { z } from 'zod';

export const createApplicationSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
});

export const updateApplicationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
});

export const assignCustomerSchema = z.object({
  applicationId: z.string().uuid(),
  customerId: z.string().uuid(),
});
