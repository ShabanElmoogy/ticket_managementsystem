export interface TenantFormValues {
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionSeats: number;
  subscriptionStart: string;
  subscriptionEnd: string;
}

export interface TenantFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: TenantFormValues;
  onClose: () => void;
  onSubmit: (values: TenantFormValues) => void;
  submitting?: boolean;
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
  createdAt?: string;
  updatedAt?: string;
}

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
};
