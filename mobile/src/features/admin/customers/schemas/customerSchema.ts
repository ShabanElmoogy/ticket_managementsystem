import { z } from 'zod';

export const customerFormSchema = z.object({
  name:  z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().check(z.email('Invalid email address')),
  phone: z.string().trim().max(30, 'Phone must be at most 30 characters').optional().or(z.literal('')),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
