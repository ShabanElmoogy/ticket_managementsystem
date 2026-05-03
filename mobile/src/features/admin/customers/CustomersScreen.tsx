import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import AdminCrudScreen        from '@/src/features/admin/shared/AdminCrudScreen';
import { ConfirmDeleteDialog }    from '@/src/shared/components';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { useToast }           from '@/src/shared/hooks/useToast';
import { useErrorHandler }    from '@/src/shared/hooks/useErrorHandler';
import { customersKeys } from '@/src/features/admin/customers/api/customers';
import CustomerDetailScreen from '@/src/features/admin/customers/components/CustomerDetailScreen';
import CustomerForm from '@/src/features/admin/customers/components/CustomerForm';
import { useCustomers } from '@/src/features/admin/customers/hooks/useCustomers';
import type { Customer, CreateCustomerData } from '@/src/services/api/types';

const CustomersScreen: React.FC = () => {
  const { t }       = useTranslation();
  const toast       = useToast();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const { f, columns, exporting, handleExport, selectedId, setSelectedId } = useCustomers();

  // ── Detail → Edit state ────────────────────────────────────────────────────
  const [editingFromDetail,  setEditingFromDetail]  = useState<Customer | null>(null);

  // ── Detail → Delete state ──────────────────────────────────────────────────
  const [deletingFromDetail, setDeletingFromDetail] = useState<Customer | null>(null);
  const [deleting,           setDeleting]           = useState(false);

  const handleDeleteFromDetail = async () => {
    if (!deletingFromDetail) return;
    setDeleting(true);
    try {
      await f.remove(deletingFromDetail.id);
      // Remove detail query — prevents refetch of deleted resource
      queryClient.removeQueries({ queryKey: customersKeys.detail(deletingFromDetail.id) });
      toast.success(t('customers.messages.deleted'));
      setSelectedId(null);           // navigate away first
      setDeletingFromDetail(null);
    } catch (error) {
      handleError(error, { feature: 'customers', operation: 'delete' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Error handler for feature-level errors ─────────────────────────────────
  const handleFeatureError = (error: Error, errorInfo: any, errorId: string) => {
    handleError(error, { 
      feature: 'customers', 
      operation: 'feature-boundary',
      metadata: { errorId, componentStack: errorInfo.componentStack }
    });
  };

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedId && !editingFromDetail) {
    const selectedCustomer = f.entities.find((c) => c.id === selectedId);
    return (
      <FeatureErrorBoundary featureName="Customers" onError={handleFeatureError}>
        <CustomerDetailScreen
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={() => setEditingFromDetail(selectedCustomer ?? null)}
          onDelete={() => setDeletingFromDetail(selectedCustomer ?? null)}
          queryEnabled={!deletingFromDetail}
        />
        <ConfirmDeleteDialog
          open={!!deletingFromDetail}
          onClose={() => setDeletingFromDetail(null)}
          onConfirm={handleDeleteFromDetail}
          itemName={deletingFromDetail?.name}
          itemType={t('customers.itemType')}
          loading={deleting}
        />
      </FeatureErrorBoundary>
    );
  }

  // ── Edit from detail ────────────────────────────────────────────────────────
  if (editingFromDetail) {
    return (
      <FeatureErrorBoundary featureName="Customers" onError={handleFeatureError}>
        <CustomerForm
          item={editingFromDetail}
          onClose={() => {
            setEditingFromDetail(null);
            setSelectedId(editingFromDetail.id); // return to detail
          }}
          submitting={false}
          mode="page"
          onSave={async (data: CreateCustomerData) => {
            await f.update(editingFromDetail.id, data);
            // onClose() is called by CustomerForm after success — navigates back to detail
          }}
        />
      </FeatureErrorBoundary>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <FeatureErrorBoundary featureName="Customers" onError={handleFeatureError}>
      <AdminCrudScreen<Customer>
        title={t('customers.title')}
        icon="👥"
        itemType={t('customers.itemType')}
        entities={f.entities}
        loading={f.loading}
        columns={columns}
        searchFields={['name', 'email', 'phone']}
        getItemName={(c) => c.name}
        onDelete={(id) => f.remove(id)}
        onRefresh={f.refetch}
        onExport={handleExport}
        exporting={exporting}
        searchPlaceholder={t('customers.searchPlaceholder')}
        emptyMessage={t('customers.emptyMessage')}
        emptyFilteredMessage={t('customers.emptyFilteredMessage')}
        addLabel={t('customers.addTitle')}
        exportLabel={t('common.exportPdf')}
        exportingLabel={t('common.exporting')}
        refreshLabel={t('common.refresh')}
        refreshingLabel={t('common.refreshing')}
        deleteSuccessMessage={t('customers.messages.deleted')}
        onRowPress={(customer) => setSelectedId(customer.id)}
        renderForm={(item, onClose) => (
          <CustomerForm
            item={item}
            onClose={onClose}
            submitting={f.ui.submitting}
            mode="page"
            onSave={async (data: CreateCustomerData) => {
              if (item) await f.update(item.id, data);
              else      await f.create(data);
            }}
          />
        )}
      />
    </FeatureErrorBoundary>
  );
};

export default CustomersScreen;


