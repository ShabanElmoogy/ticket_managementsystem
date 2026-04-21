import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Returns the customer form schema with translated error messages.
 * Call inside the component/hook where `t` is available.
 */
export const createCustomerFormSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim()
      .min(2,   t('validation.minLength', { field: t('common.name'), min: 2 }))
      .max(100, t('validation.maxLength', { field: t('common.name'), max: 100 })),
    email: z.string().trim()
      .check(z.email(t('validation.invalidEmail'))),
    phone: z.string().trim()
      .max(30, t('validation.maxLength', { field: t('common.phone'), max: 30 }))
      .optional().or(z.literal('')),
  });

export type CustomerFormValues = z.infer<ReturnType<typeof createCustomerFormSchema>>;
