import type { User } from "../../../../services/api";

// Form values for creating/updating a user
export interface UserFormValues {
  email: string;
  name: string;
  // Optional in edit mode; required in create mode (enforced outside schema)
  password?: string;
  role: "SUPER_ADMIN" | "TENANT_ADMIN" | "EMPLOYEE" | "PROGRAMMER";
  /**
   * Tenant slug to create/update the user under.
   * Used by SUPER_ADMIN when managing users across tenants.
   */
  tenantSlug?: string;
  phone?: string;
  whatsappNotifications?: boolean;
}

export interface UserFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: UserFormValues;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
}

export interface UseUserFormArgs {
  open: boolean;
  initialValues?: UserFormValues;
  editing?: boolean;
  onSubmit: (values: UserFormValues) => void;
}

export type { User };
