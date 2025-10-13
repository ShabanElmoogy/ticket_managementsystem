export { default as CustomersTable } from "./components/CustomersTable";
export type { CustomersTableProps } from "./components/CustomersTable";

export { default as CustomersColumns, getCustomersColumns } from "./components/CustomersColumns";

export { default as CustomerFormDialog } from "./components/CustomerFormDialog";

export { default as useCustomerForm } from "./hooks/useCustomerForm";
export { default as useCustomersManagement } from "./hooks/useCustomersManagement";

export { customerFormSchema } from "./utils/validation";
export type { CustomerFormSchema, CustomerFormSchemaValues } from "./utils/validation";

export type {
  CustomerFormValues,
  CustomerFormDialogProps,
  UseCustomerFormArgs,
} from "./types/types";
