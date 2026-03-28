import { z } from 'zod';

export const tenantFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9-]*$/, 'Slug may only contain lowercase letters, numbers and hyphens')
    .optional()
    .or(z.literal('')),
  subscriptionPlan: z.string().optional(),
  subscriptionStatus: z.string().optional(),
  subscriptionSeats: z.coerce.number().int().min(0).default(0),
  subscriptionStart: z.string().optional().or(z.literal('')),
  subscriptionEnd: z.string().optional().or(z.literal('')),
  supportEmail: z.string().trim().optional().or(z.literal('')),
});

export type TenantFormSchema = typeof tenantFormSchema;
export type TenantFormSchemaValues = z.infer<typeof tenantFormSchema>;
