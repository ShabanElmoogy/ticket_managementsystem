// Re-export shared API types so feature code imports from one place
export type {
  Customer,
  CustomerApplication,
  CreateCustomerData,
  MaintenanceType,
  SubscriptionStatus,
} from '../../../../services/api/types/customer.ts';

export type { Application } from '../../../../services/api/types/application.ts';

// ── Feature-local types ──────────────────────────────────────────────────────

import type { Customer, CreateCustomerData } from '../../../../services/api/types/customer.ts';
import type { Application } from '../../../../services/api/types/application.ts';

export type CustomerFormValues = CreateCustomerData;

export interface CustomerFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: CustomerFormValues;
  applications: Application[];
  appsLoading?: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => void;
  submitting?: boolean;
}

export interface UseCustomerFormArgs {
  open: boolean;
  initialValues?: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => void;
}

export interface CustomersTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}
