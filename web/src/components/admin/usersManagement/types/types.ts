import type { User } from "../../../../services/api";
import type { UserRole } from "../../../../types/roles";

export interface UserFormValues {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
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
