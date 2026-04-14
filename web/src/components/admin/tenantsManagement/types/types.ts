export interface TenantStats {
  userCount: number;
  ticketCount: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionStart?: string | null;
  subscriptionEnd?: string | null;
  subscriptionSeats?: number;
  supportEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _stats?: TenantStats;
}

export interface TenantFormValues {
  name: string;
  slug?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionSeats: number;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  supportEmail?: string;
}

export interface TenantFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: TenantFormValues;
  onClose: () => void;
  onSubmit: (values: TenantFormValues) => void;
  submitting?: boolean;
}

export interface TenantsTableProps {
  tenants: Tenant[];
  loading: boolean;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
  onStatusChange: (tenant: Tenant, status: string) => void;
}
