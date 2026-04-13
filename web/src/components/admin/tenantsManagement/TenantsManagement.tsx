import React from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { ErrorBoundary } from '../../../shared/components/feedback/ErrorBoundary';
import { DeleteConfirmDialog, MyGridHeader } from '../../../shared/components';
import { TenantsTable, TenantFormDialog } from '.';
import { tenantsApi } from './api/tenants';
import { tenantsKeys } from './api/queryKeys';
import { tenantToFormValues, toISO } from './utils/toFormValues';
import type { Tenant, TenantFormValues } from './types/types';

function TenantsManagement() {
  const f = useAdminFeature<Tenant, TenantFormValues>({
    entityName: 'tenants',
    queryKey: tenantsKeys.all,
    api: {
      getAll:  tenantsApi.list.bind(tenantsApi),
      create:  tenantsApi.create.bind(tenantsApi),
      update:  (id, data) => tenantsApi.update(id, {
        name:               data.name,
        slug:               data.slug || undefined,
        subscriptionPlan:   data.subscriptionPlan,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionSeats:  data.subscriptionSeats || undefined,
        subscriptionStart:  data.subscriptionStart ? toISO(data.subscriptionStart) ?? undefined : undefined,
        subscriptionEnd:    data.subscriptionEnd   ? toISO(data.subscriptionEnd)   ?? undefined : undefined,
        supportEmail:       data.supportEmail || undefined,
      }),
      delete: (id) => tenantsApi.delete(id),
    },
    messages: {
      success: { created: 'Tenant created successfully', updated: 'Tenant updated successfully', deleted: 'Tenant deleted successfully' },
      error:   { create:  'Error creating tenant',       update:  'Error updating tenant',       delete:  'Error deleting tenant'       },
      titles:  { create:  'Create New Tenant',           edit:    'Edit Tenant'                                                         },
    },
  });

  const [statsMap, setStatsMap] = React.useState<Record<string, { userCount: number; ticketCount: number }>>({});

  React.useEffect(() => {
    if (!f.entities.length) return;
    f.entities.forEach((t) => {
      tenantsApi.getStats(t.id)
        .then((s) => setStatsMap((prev) => ({ ...prev, [t.id]: s })))
        .catch(() => {});
    });
  }, [f.entities]);

  const tenantsWithStats = f.entities.map((t) => ({ ...t, _stats: statsMap[t.id] }));

  const handleStatusChange = async (tenant: Tenant, status: string) => {
    try {
      if (status === 'ACTIVE') {
        await tenantsApi.activate(tenant.id);
      } else {
        await tenantsApi.update(tenant.id, { subscriptionStatus: status });
      }
      f.showSnackbar(`"${tenant.name}" status changed to ${status}`, 'success');
      f.refetch();
    } catch (error) {
      f.showSnackbar(f.handleError(error, 'Error updating tenant status'), 'error');
    }
  };

  const initialValues = f.ui.editingItem
    ? tenantToFormValues(f.ui.editingItem)
    : undefined;

  return (
    <ErrorBoundary>
      <Box>
        <MyGridHeader
          title="Tenants Management"
          onAdd={() => f.openDialog()}
          addButtonText="Add Tenant"
          addTooltip="Create a new tenant"
          icon={ApartmentIcon}
        />

        <TenantsTable
          tenants={tenantsWithStats}
          loading={f.loading}
          onEdit={f.openDialog}
          onDelete={f.openDeleteDialog}
          onStatusChange={handleStatusChange}
        />

        <TenantFormDialog
          open={f.ui.dialogOpen}
          editing={!!f.ui.editingItem}
          initialValues={initialValues}
          onClose={f.closeDialog}
          onSubmit={(values) => f.handleSubmit(values)}
          submitting={f.ui.submitting}
        />

        <DeleteConfirmDialog
          open={f.ui.deleteDialog.open}
          onClose={f.closeDeleteDialog}
          onConfirm={() => f.handleDeleteConfirm((t) => t.id, { onSuccess: () => f.refetch() })}
          itemName={f.ui.deleteDialog.item?.name}
          itemType="tenant"
          loading={false}
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

export default TenantsManagement;
