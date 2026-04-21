import React, { useState } from 'react';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { customersApi, customersKeys } from './api/customers';
import AdminCrudScreen from '../shared/AdminCrudScreen';
import AdminFormModal from '../shared/AdminFormModal';
import { AppTextInput, AppBadge } from '../../../shared/components';
import { exportEntityPdf } from '../../../shared/utils/exportEntityPdf';
import type { Customer, CreateCustomerData } from '../../../services/api/types';
import type { ColDef } from '../../../shared/components';

const COLUMNS: ColDef<Customer>[] = [
  { field: 'name',               headerName: 'Name',       flex: 1,   sortable: true  },
  { field: 'email',              headerName: 'Email',      width: 180, sortable: true  },
  { field: 'phone',              headerName: 'Phone',      width: 130, sortable: false },
  {
    field: 'subscriptionStatus', headerName: 'Status',     width: 110, align: 'center',
    renderCell: (row) => row.subscriptionStatus
      ? <AppBadge label={row.subscriptionStatus} variant="status" size="small" />
      : null,
  },
  {
    field: '_count',             headerName: 'Tickets',    width: 80,  align: 'center',
    valueGetter: (row) => row._count?.tickets ?? 0,
  },
];

const CustomerForm: React.FC<{
  item: Customer | null; onClose: () => void;
  onSave: (data: CreateCustomerData) => Promise<void>; submitting: boolean;
}> = ({ item, onClose, onSave, submitting }) => {
  const [name,  setName]  = useState(item?.name  ?? '');
  const [email, setEmail] = useState(item?.email ?? '');
  const [phone, setPhone] = useState(item?.phone ?? '');

  return (
    <AdminFormModal open title={item ? 'Edit Customer' : 'Add Customer'} onClose={onClose}
      onSubmit={() => onSave({ name, email, phone: phone || undefined })} submitting={submitting}
    >
      <AppTextInput label="Name *"  value={name}  onChangeText={setName}  placeholder="Customer name" />
      <AppTextInput label="Email *" value={email} onChangeText={setEmail} fieldType="email" placeholder="email@example.com" />
      <AppTextInput label="Phone"   value={phone} onChangeText={setPhone} placeholder="+1234567890" />
    </AdminFormModal>
  );
};

const CustomersScreen: React.FC = () => {
  const [exporting, setExporting] = useState(false);

  const f = useAdminFeature<Customer, CreateCustomerData>({
    entityName: 'customers', queryKey: customersKeys.all,
    api: {
      getAll:  customersApi.getCustomers.bind(customersApi),
      create:  customersApi.createCustomer.bind(customersApi),
      update:  customersApi.updateCustomer.bind(customersApi),
      delete:  customersApi.deleteCustomer.bind(customersApi),
    },
    messages: {
      success: { created: 'Customer created', updated: 'Customer updated', deleted: 'Customer deleted' },
      error:   { create: 'Error creating customer', update: 'Error updating customer', delete: 'Error deleting customer' },
      titles:  { create: 'Add Customer', edit: 'Edit Customer' },
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try { await exportEntityPdf('Customers', f.entities, COLUMNS); }
    finally { setExporting(false); }
  };

  return (
    <AdminCrudScreen<Customer>
      title="Customers" icon="👥" itemType="customer"
      entities={f.entities} loading={f.loading}
      columns={COLUMNS} searchFields={['name', 'email']}
      getItemName={(c) => c.name} onDelete={(id) => f.remove(id)}
      onRefresh={f.refetch}
      onExport={handleExport}
      exporting={exporting}
      renderForm={(item, onClose) => (
        <CustomerForm item={item} onClose={onClose} submitting={f.ui.submitting}
          onSave={async (data) => { if (item) await f.update(item.id, data); else await f.create(data); onClose(); }}
        />
      )}
    />
  );
};

export default CustomersScreen;
