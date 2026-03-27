import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  applicationIds: z.array(z.string().uuid()).optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  applicationIds: z.array(z.string().uuid()).optional(),
});

export const assignApplicationSchema = z.object({
  customerId: z.string().uuid(),
  applicationId: z.string().uuid(),
});
