import type { Tenant } from '../types/types';
import type { TenantFormValues } from '../types/types';

function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function tenantToFormValues(t: Tenant): TenantFormValues {
  return {
    name:               t.name,
    slug:               t.slug               ?? '',
    subscriptionPlan:   t.subscriptionPlan   ?? 'FREE',
    subscriptionStatus: t.subscriptionStatus ?? 'ACTIVE',
    subscriptionSeats:  t.subscriptionSeats  ?? 0,
    subscriptionStart:  toDateInput(t.subscriptionStart),
    subscriptionEnd:    toDateInput(t.subscriptionEnd),
    supportEmail:       t.supportEmail       ?? '',
  };
}
