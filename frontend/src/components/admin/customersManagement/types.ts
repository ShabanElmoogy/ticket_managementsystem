import type { CreateCustomerData, Application } from "../../../services/api";

export type CustomerFormValues = CreateCustomerData;

export interface CustomerFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: CustomerFormValues;
  applications: Application[];
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => void;
}

export interface UseCustomerFormArgs {
  open: boolean;
  initialValues?: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => void;
}
