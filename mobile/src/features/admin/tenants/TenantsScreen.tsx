import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AdminCrudScreen from '@/src/features/admin/shared/AdminCrudScreen';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { tenantsApi, tenantsKeys, type Tenant } from '@/src/features/admin/tenants/api/tenants';
import { AppTextInput, AppFormField, AppBadge } from '@/src/shared/components';
import { useAdminFeature } from '@/src/shared/hooks/useAdminFeature';
import { useErrorHandler } from '@/src/shared/hooks/useErrorHandler';
import { useToast } from '@/src/shared/hooks/useToast';
import { networkEvents } from '@/src/services/api/networkEvents';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import type { ColDef } from '@/src/shared/components';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    '#10b981',
  TRIAL:     '#3b82f6',
  PAST_DUE:  '#f59e0b',
  SUSPENDED: '#ef4444',
  EXPIRED:   '#6b7280',
};

interface TenantFormData { name: string; slug: string; supportEmail: string; }

// ── Schema ────────────────────────────────────────────────────────────────────

const createTenantSchema = (t: (k: string, o?: any) => string) =>
  z.object({
    name:         z.string().trim().min(2, t('validation.minLength', { field: t('common.name'), min: 2 })).max(100),
    slug:         z.string().trim().min(2).max(60).optional().or(z.literal('')),
    supportEmail: z.string().trim().check(z.email(t('validation.invalidEmail'))).optional().or(z.literal('')),
  });

// ── Inline TenantForm — follows unified form pattern ─────────────────────────

const TenantForm: React.FC<{
  item:       Tenant | null;
  onClose:    () => void;
  onSave:     (data: TenantFormData) => Promise<void>;
  submitting: boolean;
}> = ({ item, onClose, onSave, submitting }) => {
  const { t }  = useTranslation();
  const toast  = useToast();

  // ── Duplicate detection ──────────────────────────────────────────────────
  const isDuplicateError = useRef(false);

  useEffect(() => {
    const unsub = networkEvents.onOkPress(() => {
      if (isDuplicateError.current) {
        isDuplicateError.current = false;
        onClose();
      }
    });
    return () => { unsub(); };
  }, [onClose]);

  // ── RHF ──────────────────────────────────────────────────────────────────
  const form = useForm({
    resolver: zodResolver(createTenantSchema(t)),
    mode: 'onBlur',
    defaultValues: {
      name:         item?.name         ?? '',
      slug:         item?.slug         ?? '',
      supportEmail: item?.supportEmail ?? '',
    },
  });

  const { control, handleSubmit, formState: { isSubmitting, errors } } = form;

  const firstInputRef = useFocusInput({ inModal: true, enabled: true });
  const slugRef       = useRef<any>(null);
  const emailRef      = useRef<any>(null);

  // ── Submit ────────────────────────────────────────────────────────────────
  const doSave = async (data: any) => {
    try {
      await onSave({ name: data.name, slug: data.slug || '', supportEmail: data.supportEmail || '' });
      // ✅ Toast BEFORE onClose
      toast.success(item ? t('tenants.messages.updated') : t('tenants.messages.created'));
      onClose();
    } catch (err: any) {
      const serverMsg: string =
        err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';
      if (serverMsg.toLowerCase().includes('already exists')) {
        isDuplicateError.current = true;
        toast.error(t('tenants.duplicateError.title'), t('tenants.duplicateError.message'));
        return;
      }
      // Re-throw so react-hook-form resets isSubmitting → button becomes active again
      throw err;
    }
  };

  return (
    <AdminFormModal
      open
      title={item ? t('tenants.editTitle') : t('tenants.addTitle')}
      onClose={onClose}
      onSubmit={handleSubmit(doSave)}
      submitting={submitting || isSubmitting}
    >
      <AppFormField name="name" control={control}>
        <AppTextInput
          inputRef={firstInputRef}
          nextRef={slugRef}
          label={t('tenants.form.name')}
          placeholder={t('tenants.form.namePlaceholder')}
          required
          autoCapitalize="words"
          maxLength={100}
          showClearButton
        />
      </AppFormField>
      <AppFormField name="slug" control={control}>
        <AppTextInput
          inputRef={slugRef}
          nextRef={emailRef}
          label={t('tenants.form.slug')}
          placeholder={t('tenants.form.slugPlaceholder')}
          autoCapitalize="none"
          maxLength={60}
          showClearButton
        />
      </AppFormField>
      <AppFormField name="supportEmail" control={control}>
        <AppTextInput
          inputRef={emailRef}
          label={t('tenants.form.supportEmail')}
          placeholder={t('tenants.form.supportEmailPlaceholder')}
          fieldType="email"
          maxLength={150}
          showClearButton
          blurOnSubmit
        />
      </AppFormField>
    </AdminFormModal>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const TenantsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  const columns: ColDef<Tenant>[] = [
    { field: 'name', headerName: t('tenants.columns.name'), sortable: true },
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

  const handleFeatureError = (error: Error, errorInfo: any, errorId: string) => {
    handleError(error, {
      feature: 'tenants',
      operation: 'feature-boundary',
      metadata: { errorId, componentStack: errorInfo.componentStack },
    });
  };

  return (
    <FeatureErrorBoundary featureName="Tenants" onError={handleFeatureError}>
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
              // TenantForm.doSave handles toast + duplicate detection + error
              if (item) await f.update(item.id, data);
              else      await f.create(data);
            }}
          />
        )}
      />
    </FeatureErrorBoundary>
  );
};

export default TenantsScreen;
