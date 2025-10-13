import type {
  CreateApplicationData,
  CustomerApplication,
} from "../../../../services/api";

// Alias the API CreateApplicationData for form usage
export type ApplicationFormValues = CreateApplicationData;

export interface ApplicationFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: ApplicationFormValues;
  onClose: () => void;
  onSubmit: (values: ApplicationFormValues) => void;
}

export interface UseApplicationFormArgs {
  open: boolean;
  initialValues?: ApplicationFormValues;
  onSubmit: (values: ApplicationFormValues) => void;
}

export interface Application {
  id: string;
  name: string;
  description?: string;
  version?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customers?: CustomerApplication[];
  _count?: {
    tickets: number;
    customers: number;
  };
}

export interface ApplicationsTableProps {
  applications: Application[];
  loading: boolean;
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
}

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

export type DeleteDialogState = {
  open: boolean;
  application: Application | null;
  loading: boolean;
};

