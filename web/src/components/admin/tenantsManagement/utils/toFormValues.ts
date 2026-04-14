import type { Tenant } from '../types/types';
import type { TenantFormValues } from '../types/types';

/** Convert a date-input string (YYYY-MM-DD) or ISO string to a full ISO string, or null. */
export function toISO(val: string): string | null {
  return val ? new Date(val).toISOString() : null;
}

/** Convert an ISO string to a date-input value (YYYY-MM-DD). */
export function toDate(iso?: string | null): string {
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
    subscriptionStart:  toDate(t.subscriptionStart),
    subscriptionEnd:    toDate(t.subscriptionEnd),
    supportEmail:       t.supportEmail       ?? '',
  };
}

/** Map form values to the API update payload, converting date strings to ISO. */
export function tenantFormValuesToPayload(data: TenantFormValues) {
  return {
    name:               data.name,
    slug:               data.slug               || undefined,
    subscriptionPlan:   data.subscriptionPlan,
    subscriptionStatus: data.subscriptionStatus,
    subscriptionSeats:  data.subscriptionSeats  || undefined,
    subscriptionStart:  data.subscriptionStart  ? toISO(data.subscriptionStart) ?? undefined : undefined,
    subscriptionEnd:    data.subscriptionEnd    ? toISO(data.subscriptionEnd)   ?? undefined : undefined,
    supportEmail:       data.supportEmail       || undefined,
  };
}
