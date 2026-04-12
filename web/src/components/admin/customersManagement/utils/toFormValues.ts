import type { Customer } from '../../../../services/api/types/customer.ts';
import type { CustomerFormValues } from '../types/types';

export function customerToFormValues(c: Customer): CustomerFormValues {
  return {
    name:                  c.name,
    email:                 c.email,
    phone:                 c.phone        ?? '',
    address:               c.address      ?? '',
    description:           c.description  ?? '',
    applicationIds:        c.applications?.map((ca) => ca.applicationId) ?? [],
    maintenanceType:       c.maintenanceType ?? null,
    subscriptionStartDate: c.subscriptionStartDate ? new Date(c.subscriptionStartDate) : null,
    subscriptionEndDate:   c.subscriptionEndDate   ? new Date(c.subscriptionEndDate)   : null,
  };
}
