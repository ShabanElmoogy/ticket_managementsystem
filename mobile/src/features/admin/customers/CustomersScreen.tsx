import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminCrudScreen from '@/src/features/admin/shared/AdminCrudScreen';
import CustomerForm    from './components/CustomerForm';
import { useCustomers } from './hooks/useCustomers';
import type { Customer, CreateCustomerData } from '@/src/services/api/types';

const CustomersScreen: React.FC = () => {
  const { t } = useTranslation();
  const { f, columns, exporting, handleExport } = useCustomers();

  return (
    <AdminCrudScreen<Customer>
      title={t('customers.title')}
      icon="👥"
      itemType={t('customers.itemType')}
      entities={f.entities}
      loading={f.loading}
      columns={columns}
      searchFields={['name', 'email']}
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
      renderForm={(item, onClose) => (
        <CustomerForm
          item={item}
          onClose={onClose}
          submitting={f.ui.submitting}
          onSave={async (data: CreateCustomerData) => {
            if (item) await f.update(item.id, data);
            else      await f.create(data);
            onClose();
          }}
        />
      )}
    />
  );
};

export default CustomersScreen;
