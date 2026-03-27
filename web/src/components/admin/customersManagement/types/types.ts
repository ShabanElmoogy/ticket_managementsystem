import type { CreateCustomerData } from "../../../../services/api";
import type { Application } from "../../applicationsManagement/types/types";

export type CustomerFormValues = CreateCustomerData;

export interface CustomerFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: CustomerFormValues;
  applications: Application[];
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => void;
  submitting?: boolean;
}

export interface UseCustomerFormArgs {
  open: boolean;
  initialValues?: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => void;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  applications?: CustomerApplication[];
  _count?: {
    tickets: number;
  };
}

export interface CustomerApplication {
  id: string;
  customerId: string;
  applicationId: string;
  assignedAt: string;
  customer?: Customer;
  application?: Application;
}