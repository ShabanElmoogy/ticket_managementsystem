import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Returns the application form schema with translated error messages.
 * Call inside the component/hook where `t` is available.
 */
export const createApplicationFormSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim()
      .min(3,   t('validation.minLength', { field: t('common.name'), min: 3 }))
      .max(100, t('validation.maxLength', { field: t('common.name'), max: 100 })),
    description: z.string().trim()
      .max(500, t('validation.maxLength', { field: t('common.description'), max: 500 }))
      .optional().or(z.literal('')),
    version: z.string().trim()
      .max(50, t('validation.maxLength', { field: t('common.version'), max: 50 }))
      .optional().or(z.literal('')),
  });

export type ApplicationFormValues = z.infer<ReturnType<typeof createApplicationFormSchema>>;
