import { z } from 'zod';

const SUBSCRIPTION_PLANS   = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
const SUBSCRIPTION_STATUSES = ['ACTIVE', 'SUSPENDED', 'PAST_DUE', 'CANCELED', 'EXPIRED'];

const dateOrNull = z.string().datetime().nullable().optional();

export const createTenantSchema = z.object({
  name:               z.string().trim().min(1, 'name is required').max(150),
  slug:               z.string().trim().max(63).optional(),
  subscriptionPlan:   z.enum(SUBSCRIPTION_PLANS).optional(),
  subscriptionStatus: z.enum(SUBSCRIPTION_STATUSES).optional(),
  subscriptionStart:  dateOrNull,
  subscriptionEnd:    dateOrNull,
  subscriptionSeats:  z.number().int().min(0).optional(),
  supportEmail:       z.string().trim().email('Invalid email').nullable().optional(),
});

export const updateTenantSchema = z.object({
  name:               z.string().trim().min(1).max(150).optional(),
  slug:               z.string().trim().max(63).optional(),
  subscriptionPlan:   z.enum(SUBSCRIPTION_PLANS).optional(),
  subscriptionStatus: z.enum(SUBSCRIPTION_STATUSES).optional(),
  subscriptionStart:  dateOrNull,
  subscriptionEnd:    dateOrNull,
  subscriptionSeats:  z.number().int().min(0).optional(),
  supportEmail:       z.string().trim().email('Invalid email').nullable().optional(),
});
