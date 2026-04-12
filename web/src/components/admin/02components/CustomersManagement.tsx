import { Box, Snackbar, Alert } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { useAuxData } from '../../../shared/hooks/useAuxData';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { DeleteConfirmDialog, MyGridHeader } from '../../common';
import { CustomersTable, CustomerFormDialog } from '../customersManagement';
import { customersKeys } from '../customersManagement/api/queryKeys';
import { applicationsKeys } from '../applicationsManagement/api/queryKeys';
import { customerToFormValues } from '../customersManagement/utils/toFormValues';
import { type Customer, type CreateCustomerData, type Application, customersApi, applicationsApi } from '../../../services/api';

export default function CustomersManagement() {
  const f = useAdminFeature<Customer, CreateCustomerData>({
    entityName: 'customers',
    queryKey: customersKeys.all,
    api: {
      getAll:  customersApi.getCustomers.bind(customersApi),
      create:  customersApi.createCustomer.bind(customersApi),
      update:  customersApi.updateCustomer.bind(customersApi),
      delete:  customersApi.deleteCustomer.bind(customersApi),
    },
    messages: {
      success: { created: 'Customer created successfully', updated: 'Customer updated successfully', deleted: 'Customer deleted successfully' },
      error:   { create:  'Error creating customer',       update:  'Error updating customer',       delete:  'Error deleting customer'       },
      titles:  { create:  'Create New Customer',           edit:    'Edit Customer'                                                           },
    },
  });

  const { data: applications = [], isLoading: auxLoading } = useAuxData<Application[]>(
    applicationsKeys.all,
    applicationsApi.getApplications.bind(applicationsApi),
  );

  const initialValues = f.ui.editingItem
    ? customerToFormValues(f.ui.editingItem)
    : undefined;

  return (
    <ErrorBoundary>
      <Box>
        <MyGridHeader
          title="Customers Management"
          onAdd={() => f.openDialog()}
          addButtonText="Add Customer"
          addTooltip="Add Customer"
          icon={PeopleIcon}
        />

        <CustomersTable
          customers={f.entities}
          loading={f.loading || auxLoading}
          onEdit={f.openDialog}
          onDelete={f.openDeleteDialog}
        />

        <CustomerFormDialog
          open={f.ui.dialogOpen}
          editing={!!f.ui.editingItem}
          initialValues={initialValues}
          applications={applications}
          appsLoading={auxLoading}
          onClose={f.closeDialog}
          onSubmit={(values) => f.handleSubmit(values)}
          submitting={f.ui.submitting}
        />

        <DeleteConfirmDialog
          open={f.ui.deleteDialog.open}
          onClose={f.closeDeleteDialog}
          onConfirm={() => f.handleDeleteConfirm((c) => c.id)}
          itemName={f.ui.deleteDialog.item?.name}
          itemType="customer"
          loading={false}
          warningMessage={
            (f.ui.deleteDialog.item?._count?.tickets ?? 0) > 0
              ? `This customer has ${f.ui.deleteDialog.item!._count!.tickets} associated ticket(s). Please reassign or delete them first.`
              : undefined
          }
        />

        <Snackbar open={f.ui.snackbar.open} autoHideDuration={6000} onClose={f.closeSnackbar}>
          <Alert onClose={f.closeSnackbar} severity={f.ui.snackbar.severity}>
            {f.ui.snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}
