import type { Customer, SubscriptionStatus } from '../../services/api/types';

export const getCustomerStatus = (customer: Customer): SubscriptionStatus => {
  const now = new Date();
  const { maintenanceType, subscriptionStartDate, subscriptionEndDate } = customer;

  if (!maintenanceType) return 'INACTIVE';
  if (maintenanceType === 'PAY_AS_YOU_GO') return 'PAY_AS_YOU_GO';

  if (!subscriptionStartDate || !subscriptionEndDate) return 'INACTIVE';

  const start = new Date(subscriptionStartDate);
  const end = new Date(subscriptionEndDate);
  const withinRange = now >= start && now <= end;

  if (maintenanceType === 'FREE_TRIAL') return withinRange ? 'TRIAL' : 'EXPIRED';
  if (maintenanceType === 'MONTHLY_SUBSCRIPTION') return withinRange ? 'ACTIVE' : 'EXPIRED';

  return 'INACTIVE';
};

export const isCustomerActive = (customer: Customer): boolean => {
  const s = getCustomerStatus(customer);
  return s === 'ACTIVE' || s === 'TRIAL';
};

/** Returns days until expiry. Negative = already expired. null = no end date. */
export const daysUntilExpiry = (customer: Customer): number | null => {
  if (!customer.subscriptionEndDate) return null;
  return Math.ceil((new Date(customer.subscriptionEndDate).getTime() - Date.now()) / 86400000);
};

export const MAINTENANCE_LABELS: Record<string, string> = {
  MONTHLY_SUBSCRIPTION: 'Monthly Subscription',
  FREE_TRIAL: 'Free Trial',
  PAY_AS_YOU_GO: 'Pay As You Go',
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: 'success' | 'warning' | 'error' | 'default' | 'info' }
> = {
  ACTIVE:        { label: 'Active',           color: 'success' },
  TRIAL:         { label: 'Trial',            color: 'info'    },
  EXPIRED:       { label: 'Expired',          color: 'error'   },
  PAY_AS_YOU_GO: { label: 'Pay per Service',  color: 'warning' },
  INACTIVE:      { label: 'Inactive',         color: 'default' },
};
