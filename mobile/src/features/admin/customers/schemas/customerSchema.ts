import { z } from 'zod';
import type { TFunction } from 'i18next';

export const MAINTENANCE_TYPES = ['MONTHLY_SUBSCRIPTION', 'FREE_TRIAL', 'PAY_AS_YOU_GO'] as const;
export type MaintenanceType = typeof MAINTENANCE_TYPES[number];

/**
 * Returns the customer form schema with translated error messages.
 * Covers all fields accepted by POST/PUT /customers.
 */
export const createCustomerFormSchema = (t: TFunction) =>
  z.object({
    // Required
    name: z.string().trim()
      .min(2,   t('validation.minLength', { field: t('common.name'), min: 2 }))
      .max(100, t('validation.maxLength', { field: t('common.name'), max: 100 })),
    email: z.string().trim()
      .check(z.email(t('validation.invalidEmail'))),

    // Optional contact
    phone: z.string().trim()
      .max(30, t('validation.maxLength', { field: t('common.phone'), max: 30 }))
      .optional().or(z.literal('')),
    company: z.string().trim()
      .max(100, t('validation.maxLength', { field: t('customers.form.company'), max: 100 }))
      .optional().or(z.literal('')),
    address: z.string().trim()
      .max(255, t('validation.maxLength', { field: t('customers.form.address'), max: 255 }))
      .optional().or(z.literal('')),

    // Optional maintenance
    maintenanceType: z.enum(MAINTENANCE_TYPES).nullable().optional(),
    subscriptionStartDate: z.string().nullable().optional(),
    subscriptionEndDate:   z.string().nullable().optional(),
  });

export type CustomerFormValues = z.infer<ReturnType<typeof createCustomerFormSchema>>;
