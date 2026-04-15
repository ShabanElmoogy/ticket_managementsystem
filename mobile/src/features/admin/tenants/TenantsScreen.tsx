import React, { useState } from 'react';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { tenantsApi, tenantsKeys, type Tenant } from './api/tenants';
import AdminCrudScreen from '../shared/AdminCrudScreen';
import AdminFormModal from '../shared/AdminFormModal';
import AppTextInput from '../../../shared/components/AppTextInput';
import AppBadge from '../../../shared/components/AppBadge';
import type { ColDef } from '../../../shared/components/AppDataTable';
import { useUiStore } from '../../../stores/uiStore';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#10b981', TRIAL: '#3b82f6', PAST_DUE: '#f59e0b',
  SUSPENDED: '#ef4444', EXPIRED: '#6b7280',
};

const COLUMNS: ColDef<Tenant>[] = [
  { field: 'name', headerName: 'Name', flex: 1, sortable: true },
  { field: 'slug', headerName: 'Slug', width: 140, sortable: true },
  {
    field: 'subscriptionStatus', headerName: 'Status', width: 110, align: 'center',
    renderCell: (row) => row.subscriptionStatus
      ? <AppBadge label={row.subscriptionStatus} color={STATUS_COLOR[row.subscriptionStatus] ?? '#6b7280'} size="small" />
      : null,
  },
  { field: 'subscriptionPlan', headerName: 'Plan',  width: 110, sortable: true },
  { field: 'subscriptionSeats', headerName: 'Seats', width: 70, align: 'center', sortable: true },
];

interface TenantFormData { name: string; slug: string; supportEmail: string; }

const TenantForm: React.FC<{
  item: Tenant | null; onClose: () => void;
  onSave: (data: TenantFormData) => Promise<void>; submitting: boolean;
}> = ({ item, onClose, onSave, submitting }) => {
  const [name,         setName]         = useState(item?.name         ?? '');
  const [slug,         setSlug]         = useState(item?.slug         ?? '');
  const [supportEmail, setSupportEmail] = useState(item?.supportEmail ?? '');

  return (
    <AdminFormModal open title={item ? 'Edit Tenant' : 'Add Tenant'} onClose={onClose}
      onSubmit={() => onSave({ name, slug, supportEmail })} submitting={submitting}
    >
      <AppTextInput label="Name *"        value={name}         onChangeText={setName}         placeholder="Tenant name" />
      <AppTextInput label="Slug"          value={slug}         onChangeText={setSlug}         placeholder="tenant-slug" autoCapitalize="none" />
      <AppTextInput label="Support Email" value={supportEmail} onChangeText={setSupportEmail} fieldType="email" placeholder="support@tenant.com" />
    </AdminFormModal>
  );
};

const TenantsScreen: React.FC = () => {
  const f = useAdminFeature<Tenant, TenantFormData>({
    entityName: 'tenants', queryKey: tenantsKeys.all,
    api: {
      getAll:  tenantsApi.list.bind(tenantsApi),
      create:  tenantsApi.create.bind(tenantsApi),
      update:  tenantsApi.update.bind(tenantsApi),
      delete:  tenantsApi.remove.bind(tenantsApi),
    },
    messages: {
      success: { created: 'Tenant created', updated: 'Tenant updated', deleted: 'Tenant deleted' },
      error:   { create: 'Error creating tenant', update: 'Error updating tenant', delete: 'Error deleting tenant' },
      titles:  { create: 'Add Tenant', edit: 'Edit Tenant' },
    },
  });

  return (
    <AdminCrudScreen<Tenant>
      title="Tenants" icon="🏢" itemType="tenant"
      entities={f.entities} loading={f.loading}
      columns={COLUMNS} searchFields={['name', 'slug']}
      getItemName={(t) => t.name} onDelete={(id) => f.remove(id)}
      renderForm={(item, onClose) => (
        <TenantForm item={item} onClose={onClose} submitting={f.ui.submitting}
          onSave={async (data) => { if (item) await f.update(item.id, data); else await f.create(data); onClose(); }}
        />
      )}
    />
  );
};

export default TenantsScreen;
