import { z } from 'zod';
import type { TFunction } from 'i18next';

export const MAINTENANCE_TYPES = ['MONTHLY_SUBSCRIPTION', 'FREE_TRIAL', 'PAY_AS_YOU_GO'] as const;
export type MaintenanceType = typeof MAINTENANCE_TYPES[number];

/** Types that require subscription start + end dates */
const DATE_REQUIRED_TYPES: MaintenanceType[] = ['MONTHLY_SUBSCRIPTION', 'FREE_TRIAL'];

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
    latitude:  z.coerce.number().min(-90,  t('customers.location.latRange')).max(90,  t('customers.location.latRange')).nullable().optional(),
    longitude: z.coerce.number().min(-180, t('customers.location.lngRange')).max(180, t('customers.location.lngRange')).nullable().optional(),

    // Optional maintenance
    maintenanceType: z.enum(MAINTENANCE_TYPES).nullable().optional(),
    subscriptionStartDate: z.string().nullable().optional(),
    subscriptionEndDate:   z.string().nullable().optional(),
  })
  // Cross-field: dates required when type is MONTHLY_SUBSCRIPTION or FREE_TRIAL
  .refine(
    (d) => {
      if (!d.maintenanceType) return true;
      if (!DATE_REQUIRED_TYPES.includes(d.maintenanceType)) return true;
      return !!d.subscriptionStartDate;
    },
    {
      message: t('validation.required', { field: t('customers.detail.subscriptionStart') }),
      path: ['subscriptionStartDate'],
    },
  )
  .refine(
    (d) => {
      if (!d.maintenanceType) return true;
      if (!DATE_REQUIRED_TYPES.includes(d.maintenanceType)) return true;
      return !!d.subscriptionEndDate;
    },
    {
      message: t('validation.required', { field: t('customers.detail.subscriptionEnd') }),
      path: ['subscriptionEndDate'],
    },
  )
  // End date must be after start date
  .refine(
    (d) => {
      if (!d.subscriptionStartDate || !d.subscriptionEndDate) return true;
      return new Date(d.subscriptionEndDate) >= new Date(d.subscriptionStartDate);
    },
    {
      message: t('validation.endAfterStart'),
      path: ['subscriptionEndDate'],
    },
  )
  // Latitude and longitude must both be provided or both be absent
  .refine(
    (d) => {
      const hasLat = d.latitude != null;
      const hasLng = d.longitude != null;
      return hasLat === hasLng;
    },
    {
      message: t('customers.location.bothOrNeither'),
      path: ['longitude'],
    },
  );

export type CustomerFormValues = z.infer<ReturnType<typeof createCustomerFormSchema>>;
