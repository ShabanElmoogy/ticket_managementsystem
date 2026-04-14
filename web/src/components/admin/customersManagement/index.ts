// Page
export { default as CustomersManagement } from './CustomersManagement';

// Components
export { default as CustomersTable } from './components/CustomersTable';
export { default as CustomersColumns, getCustomersColumns } from './components/CustomersColumns';
export { default as CustomerFormDialog } from './components/CustomerFormDialog';

// API
export { customersApi } from './api/customers';
export { customersKeys } from './api/queryKeys';

// Schema
export { customerFormSchema } from './schemas/customerSchema';

// Utils
export { customerToFormValues } from './utils/toFormValues';

// Types
export type {
  CustomerFormValues,
  CustomerFormDialogProps,
  UseCustomerFormArgs,
  CustomersTableProps,
} from './types/types';
