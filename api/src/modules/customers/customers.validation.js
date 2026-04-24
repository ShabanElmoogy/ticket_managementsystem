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
});

export const assignApplicationSchema = z.object({
  customerId:    z.string().uuid(),
  applicationId: z.string().uuid(),
});
