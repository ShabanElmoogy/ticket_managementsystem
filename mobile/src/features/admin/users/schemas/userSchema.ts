import { z } from 'zod';
import type { TFunction } from 'i18next';

export const USER_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE', 'PROGRAMMER'] as const;
export type UserRoleOption = typeof USER_ROLES[number];

export const createUserFormSchema = (t: TFunction, isEdit: boolean) =>
  z.object({
    name: z.string().trim()
      .min(2,   t('validation.minLength', { field: t('common.name'), min: 2 }))
      .max(100, t('validation.maxLength', { field: t('common.name'), max: 100 })),
    email: z.string().trim()
      .check(z.email(t('validation.invalidEmail'))),
    password: isEdit
      ? z.string().max(100).optional().or(z.literal(''))
      : z.string().min(6, t('validation.minLength', { field: t('users.form.password'), min: 6 })).max(100),
    phone: z.string().trim()
      .max(30, t('validation.maxLength', { field: t('common.phone'), max: 30 }))
      .optional().or(z.literal('')),
    role: z.enum(USER_ROLES),
  });

export type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>;
