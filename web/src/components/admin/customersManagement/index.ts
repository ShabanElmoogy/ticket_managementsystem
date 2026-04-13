export { default as CustomersTable } from "./components/CustomersTable";
export { default as CustomersColumns, getCustomersColumns } from "./components/CustomersColumns";
export { default as CustomerFormDialog } from "./components/CustomerFormDialog";
export { customersApi } from "./api/customers";

export type {
  CustomerFormValues,
  CustomerFormDialogProps,
  UseCustomerFormArgs,
} from "./types/types";
export type { CustomersTableProps } from "./components/CustomersTable";
