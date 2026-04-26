import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminCrudScreen from '@/src/features/admin/shared/AdminCrudScreen';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import { tenantsApi, tenantsKeys, type Tenant } from '@/src/features/admin/tenants/api/tenants';
import { AppTextInput, AppBadge } from '@/src/shared/components';
import { useAdminFeature } from '@/src/shared/hooks/useAdminFeature';
import type { ColDef } from '@/src/shared/components';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    '#10b981',
  TRIAL:     '#3b82f6',
  PAST_DUE:  '#f59e0b',
  SUSPENDED: '#ef4444',
  EXPIRED:   '#6b7280',
};

interface TenantFormData { name: string; slug: string; supportEmail: string; }

// ── Inline form ───────────────────────────────────────────────────────────────

const TenantForm: React.FC<{
  item:       Tenant | null;
  onClose:    () => void;
  onSave:     (data: TenantFormData) => Promise<void>;
  submitting: boolean;
}> = ({ item, onClose, onSave, submitting }) => {
  const { t } = useTranslation();
  const [name,         setName]         = useState(item?.name         ?? '');
  const [slug,         setSlug]         = useState(item?.slug         ?? '');
  const [supportEmail, setSupportEmail] = useState(item?.supportEmail ?? '');

  return (
    <AdminFormModal
      open
      title={item ? t('tenants.editTitle') : t('tenants.addTitle')}
      onClose={onClose}
      onSubmit={() => onSave({ name, slug, supportEmail })}
      submitting={submitting}
    >
      <AppTextInput
        label={t('tenants.form.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('tenants.form.namePlaceholder')}
        autoCapitalize="words"
      />
      <AppTextInput
        label={t('tenants.form.slug')}
        value={slug}
        onChangeText={setSlug}
        placeholder={t('tenants.form.slugPlaceholder')}
        autoCapitalize="none"
      />
      <AppTextInput
        label={t('tenants.form.supportEmail')}
        value={supportEmail}
        onChangeText={setSupportEmail}
        fieldType="email"
        placeholder={t('tenants.form.supportEmailPlaceholder')}
      />
    </AdminFormModal>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const TenantsScreen: React.FC = () => {
  const { t } = useTranslation();

  const columns: ColDef<Tenant>[] = [
    { field: 'name', headerName: t('tenants.columns.name'), flex: 1,   sortable: true },
    { field: 'slug', headerName: t('tenants.columns.slug'), width: 140, sortable: true },
    {
      field: 'subscriptionStatus', headerName: t('tenants.columns.status'), width: 110, align: 'center',
      renderCell: (row) => row.subscriptionStatus
        ? <AppBadge label={row.subscriptionStatus} color={STATUS_COLOR[row.subscriptionStatus] ?? '#6b7280'} size="small" />
        : null,
    },
    { field: 'subscriptionPlan',  headerName: t('tenants.columns.plan'),  width: 110, sortable: true },
    { field: 'subscriptionSeats', headerName: t('tenants.columns.seats'), width: 70,  align: 'center', sortable: true },
  ];

  const f = useAdminFeature<Tenant, TenantFormData>({
    entityName: 'tenants',
    queryKey:   tenantsKeys.all,
    api: {
      getAll:  tenantsApi.list.bind(tenantsApi),
      create:  tenantsApi.create.bind(tenantsApi),
      update:  tenantsApi.update.bind(tenantsApi),
      delete:  tenantsApi.remove.bind(tenantsApi),
    },
    messages: {
      success: {
        created: t('tenants.messages.created'),
        updated: t('tenants.messages.updated'),
        deleted: t('tenants.messages.deleted'),
      },
      error: {
        create: t('tenants.messages.errorCreate'),
        update: t('tenants.messages.errorUpdate'),
        delete: t('tenants.messages.errorDelete'),
      },
      titles: { create: t('tenants.addTitle'), edit: t('tenants.editTitle') },
    },
  });

  return (
    <AdminCrudScreen<Tenant>
      title={t('tenants.title')}
      icon="🏢"
      itemType={t('tenants.itemType')}
      entities={f.entities}
      loading={f.loading}
      columns={columns}
      searchFields={['name', 'slug']}
      getItemName={(ten) => ten.name}
      onDelete={(id) => f.remove(id)}
      onRefresh={f.refetch}
      searchPlaceholder={t('tenants.searchPlaceholder')}
      emptyMessage={t('tenants.emptyMessage')}
      emptyFilteredMessage={t('tenants.emptyFilteredMessage')}
      addLabel={t('tenants.addTitle')}
      refreshLabel={t('common.refresh')}
      refreshingLabel={t('common.refreshing')}
      deleteSuccessMessage={t('tenants.messages.deleted')}
      renderForm={(item, onClose) => (
        <TenantForm
          item={item}
          onClose={onClose}
          submitting={f.ui.submitting}
          onSave={async (data) => {
            if (item) await f.update(item.id, data);
            else      await f.create(data);
            onClose();
          }}
        />
      )}
    />
  );
};

export default TenantsScreen;
