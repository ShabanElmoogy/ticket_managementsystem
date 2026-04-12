import React from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { DeleteConfirmDialog, MyGridHeader } from '../../common';
import { TenantsTable, TenantFormDialog } from '../tenantsManagement';
import { tenantsApi } from '../tenantsManagement/api/tenants';
import { tenantsKeys } from '../tenantsManagement/api/queryKeys';
import { tenantToFormValues } from '../tenantsManagement/utils/toFormValues';
import type { Tenant, TenantFormValues } from '../tenantsManagement/types/types';

const toISO  = (val: string) => (val ? new Date(val).toISOString() : null);
const toDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

function TenantsPageComponent() {
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
          onSubmit={async (values) => {
            f.setSubmitting(true);
            try {
              const payload = {
                name:               values.name,
                slug:               values.slug || undefined,
                subscriptionPlan:   values.subscriptionPlan,
                subscriptionStatus: values.subscriptionStatus,
                subscriptionSeats:  values.subscriptionSeats || undefined,
                subscriptionStart:  values.subscriptionStart ? toISO(values.subscriptionStart) ?? undefined : undefined,
                subscriptionEnd:    values.subscriptionEnd   ? toISO(values.subscriptionEnd)   ?? undefined : undefined,
                supportEmail:       values.supportEmail || undefined,
              };
              if (f.ui.editingItem) {
                await f.update(f.ui.editingItem.id, values);
                f.showSnackbar(f.messages.success.updated, 'success');
              } else {
                await f.create(payload as unknown as TenantFormValues);
                f.showSnackbar(f.messages.success.created, 'success');
              }
              f.closeDialog();
            } catch (error) {
              f.showSnackbar(f.handleError(error, f.ui.editingItem ? f.messages.error.update : f.messages.error.create), 'error');
              f.logError(f.ui.editingItem ? 'Update' : 'Create', error);
            } finally {
              f.setSubmitting(false);
            }
          }}
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

export { TenantsPageComponent as TenantsManagement };
export default TenantsPageComponent;
