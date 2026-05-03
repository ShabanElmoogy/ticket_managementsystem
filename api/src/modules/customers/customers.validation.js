import { z } from 'zod';

const maintenanceType = z.enum(['MONTHLY_SUBSCRIPTION', 'FREE_TRIAL', 'PAY_AS_YOU_GO']).nullable().optional();
const dateString      = z.string().nullable().optional();

export const createCustomerSchema = z.object({
  name:                  z.string().trim().min(1, 'Name is required').max(150),
  email:                 z.string().trim().email('Invalid email').max(254),
  phone:                 z.string().trim().max(30).nullable().optional(),
  address:               z.string().trim().max(500).nullable().optional(),
  company:               z.string().trim().max(150).nullable().optional(),
  applicationIds:        z.array(z.string().uuid()).optional(),
  maintenanceType,
  subscriptionStartDate: dateString,
  subscriptionEndDate:   dateString,
  latitude:              z.number().min(-90).max(90).nullable().optional(),
  longitude:             z.number().min(-180).max(180).nullable().optional(),
}).superRefine((data, ctx) => {
  const hasLat = data.latitude != null;
  const hasLng = data.longitude != null;
  if (hasLat !== hasLng) {
    const missing = hasLat ? 'longitude' : 'latitude';
    ctx.addIssue({
      code: 'custom',
      path: [missing],
      message: `${missing} is required when the other coordinate is provided`,
    });
  }
});

export const updateCustomerSchema = z.object({
  name:                  z.string().trim().min(1).max(150).optional(),
  email:                 z.string().trim().email('Invalid email').max(254).optional(),
  phone:                 z.string().trim().max(30).nullable().optional(),
  address:               z.string().trim().max(500).nullable().optional(),
  company:               z.string().trim().max(150).nullable().optional(),
  applicationIds:        z.array(z.string().uuid()).optional(),
  maintenanceType,
  subscriptionStartDate: dateString,
  subscriptionEndDate:   dateString,
  latitude:              z.number().min(-90).max(90).nullable().optional(),
  longitude:             z.number().min(-180).max(180).nullable().optional(),
}).superRefine((data, ctx) => {
  const hasLat = data.latitude != null;
  const hasLng = data.longitude != null;
  if (hasLat !== hasLng) {
    const missing = hasLat ? 'longitude' : 'latitude';
    ctx.addIssue({
      code: 'custom',
      path: [missing],
      message: `${missing} is required when the other coordinate is provided`,
    });
  }
});

export const assignApplicationSchema = z.object({
  customerId:    z.string().uuid(),
  applicationId: z.string().uuid(),
});
