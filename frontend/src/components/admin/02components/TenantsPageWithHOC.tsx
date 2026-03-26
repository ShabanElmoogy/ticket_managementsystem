import React from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import {
  withCRUD, withUIState, withMessages, withErrorHandling,
  type CRUDProps, type UIStateProps, type MessagesProps, type ErrorHandlingProps,
} from '../../../shared';
import { DeleteConfirmDialog, MyGridHeader } from '../../common';
import { TenantsTable, TenantFormDialog } from '../tenantsManagement';
import { tenantsApi } from '../tenantsManagement/api/tenants';
import type { Tenant, TenantFormValues } from '../tenantsManagement/types/types';
import ApartmentIcon from '@mui/icons-material/Apartment';

const tenantsKeys = { all: ['tenants'] as const };

const toISO = (val: string) => (val ? new Date(val).toISOString() : null);

type TenantsPageProps = CRUDProps<Tenant, TenantFormValues> &
  UIStateProps & MessagesProps & ErrorHandlingProps;

function TenantsPageComponent(props: TenantsPageProps) {
  const {
    entities: tenants, loading, create, update, remove,
    uiState, openDialog, closeDialog,
    showSnackbar, closeSnackbar,
    openDeleteDialog, closeDeleteDialog,
    setSubmitting, messages, handleError, logError,
  } = props;

  const handleSubmit = async (values: TenantFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        slug: values.slug || undefined,
        subscriptionPlan: values.subscriptionPlan,
        subscriptionStatus: values.subscriptionStatus,
        subscriptionSeats: values.subscriptionSeats || undefined,
        subscriptionStart: toISO(values.subscriptionStart) ?? undefined,
        subscriptionEnd: toISO(values.subscriptionEnd) ?? undefined,
      };

      if (uiState.editingItem) {
        await update((uiState.editingItem as Tenant).id, values);
        showSnackbar(messages.success.updated, 'success');
      } else {
        await create(payload as unknown as TenantFormValues);
        showSnackbar(messages.success.created, 'success');
      }
      closeDialog();
    } catch (error) {
      showSnackbar(handleError(error, uiState.editingItem ? messages.error.update : messages.error.create), 'error');
      logError(uiState.editingItem ? 'Update' : 'Create', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!uiState.deleteDialog.item) return;
    try {
      await remove((uiState.deleteDialog.item as Tenant).id);
      showSnackbar(messages.success.deleted, 'success');
      closeDeleteDialog();
    } catch (error) {
      showSnackbar(handleError(error, messages.error.delete), 'error');
      logError('Delete', error);
    }
  };

  const toDateInput = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  };

  return (
    <Box>
      <MyGridHeader
        title="Tenants Management"
        onAdd={() => openDialog()}
        addButtonText="Add Tenant"
        addTooltip="Create a new tenant"
        icon={ApartmentIcon}
      />

      <TenantsTable
        tenants={tenants}
        loading={loading}
        onEdit={openDialog}
        onDelete={openDeleteDialog}
      />

      <TenantFormDialog
        open={uiState.dialogOpen}
        editing={!!uiState.editingItem}
        initialValues={
          uiState.editingItem
            ? {
                name: (uiState.editingItem as Tenant).name,
                slug: (uiState.editingItem as Tenant).slug ?? '',
                subscriptionPlan: (uiState.editingItem as Tenant).subscriptionPlan ?? 'FREE',
                subscriptionStatus: (uiState.editingItem as Tenant).subscriptionStatus ?? 'ACTIVE',
                subscriptionSeats: (uiState.editingItem as Tenant).subscriptionSeats ?? 0,
                subscriptionStart: toDateInput((uiState.editingItem as Tenant).subscriptionStart),
                subscriptionEnd: toDateInput((uiState.editingItem as Tenant).subscriptionEnd),
              }
            : undefined
        }
        onClose={closeDialog}
        onSubmit={handleSubmit}
        submitting={uiState.submitting}
      />

      <DeleteConfirmDialog
        open={uiState.deleteDialog.open}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        itemName={(uiState.deleteDialog.item as Tenant)?.name}
        itemType="tenant"
        loading={false}
      />

      <Snackbar open={uiState.snackbar.open} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={uiState.snackbar.severity}>
          {uiState.snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const TenantsPageWithHOC = withCRUD(
  withUIState(
    withMessages(withErrorHandling(TenantsPageComponent), {
      success: {
        created: 'Tenant created successfully',
        updated: 'Tenant updated successfully',
        deleted: 'Tenant deleted successfully',
      },
      error: {
        create: 'Error creating tenant',
        update: 'Error updating tenant',
        delete: 'Error deleting tenant',
      },
      titles: {
        create: 'Create New Tenant',
        edit: 'Edit Tenant',
      },
    })
  ),
  {
    entityName: 'tenants',
    queryKey: tenantsKeys.all,
    api: {
      getAll: tenantsApi.list.bind(tenantsApi),
      create: tenantsApi.create.bind(tenantsApi),
      update: (id: string, data: TenantFormValues) =>
        tenantsApi.update(id, {
          name: data.name,
          slug: data.slug || undefined,
          subscriptionPlan: data.subscriptionPlan,
          subscriptionStatus: data.subscriptionStatus,
          subscriptionSeats: data.subscriptionSeats || undefined,
          subscriptionStart: data.subscriptionStart ? new Date(data.subscriptionStart).toISOString() : null,
          subscriptionEnd: data.subscriptionEnd ? new Date(data.subscriptionEnd).toISOString() : null,
        }),
      delete: (id: string) => tenantsApi.delete(id),
    },
  }
) as React.ComponentType<{}>;

export { TenantsPageWithHOC };
export default TenantsPageWithHOC;
