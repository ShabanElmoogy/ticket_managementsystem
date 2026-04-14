import type { Customer, SubscriptionStatus } from '../../services/api/types';

export const getCustomerStatus = (customer: Customer): SubscriptionStatus => {
  const now = new Date();
  const { maintenanceType, subscriptionStartDate, subscriptionEndDate } = customer;

  if (!maintenanceType) return 'INACTIVE';
  if (maintenanceType === 'PAY_AS_YOU_GO') return 'PAY_AS_YOU_GO';
  if (!subscriptionStartDate || !subscriptionEndDate) return 'INACTIVE';

  const withinRange = now >= new Date(subscriptionStartDate) && now <= new Date(subscriptionEndDate);

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
  return Math.ceil((new Date(customer.subscriptionEndDate).getTime() - Date.now()) / 86_400_000);
};

export const MAINTENANCE_LABELS: Record<string, string> = {
  MONTHLY_SUBSCRIPTION: 'Monthly Subscription',
  FREE_TRIAL:           'Free Trial',
  PAY_AS_YOU_GO:        'Pay As You Go',
};

/** Color keys mapped to RN-friendly semantic names instead of MUI severity */
export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE:        { label: 'Active',          color: '#10b981' },
  TRIAL:         { label: 'Trial',           color: '#3b82f6' },
  EXPIRED:       { label: 'Expired',         color: '#ef4444' },
  PAY_AS_YOU_GO: { label: 'Pay per Service', color: '#f59e0b' },
  INACTIVE:      { label: 'Inactive',        color: '#6b7280' },
};
