import type { Customer, SubscriptionStatus } from '@/src/services/api/types';
import type { ThemeColors } from '@/src/constants/tokens';

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

export interface StatusConfigEntry {
  label: string;
  color: string;
}

/**
 * Returns subscription status config using semantic theme tokens.
 * Call inside a component: const cfg = getStatusConfig(useThemeColors());
 */
export function getStatusConfig(c: ThemeColors): Record<string, StatusConfigEntry> {
  return {
    ACTIVE:        { label: 'Active',          color: c.intent.success  },
    TRIAL:         { label: 'Trial',           color: c.interactive.primary },
    EXPIRED:       { label: 'Expired',         color: c.intent.error    },
    PAY_AS_YOU_GO: { label: 'Pay per Service', color: c.intent.warning  },
    INACTIVE:      { label: 'Inactive',        color: c.text.muted      },
  };
}
