import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AdminCrudScreen from '@/src/features/admin/shared/AdminCrudScreen';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { ticketTemplatesApi, ticketTemplatesKeys, type TicketTemplatePayload } from '@/src/features/admin/templates/api/templates';
import { AppTextInput, AppFormField, AppBadge } from '@/src/shared/components';
import { useAdminFeature } from '@/src/shared/hooks/useAdminFeature';
import { useErrorHandler } from '@/src/shared/hooks/useErrorHandler';
import { useToast } from '@/src/shared/hooks/useToast';
import { networkEvents } from '@/src/services/api/networkEvents';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import type { TicketTemplate } from '@/src/services/api/types/index';
import type { ColDef } from '@/src/shared/components';

// ── Schema ────────────────────────────────────────────────────────────────────

const createTemplateSchema = (t: (k: string, o?: any) => string) =>
  z.object({
    name: z.string().trim()
      .min(2, t('validation.minLength', { field: t('common.name'), min: 2 }))
      .max(100, t('validation.maxLength', { field: t('common.name'), max: 100 })),
    description: z.string().trim().max(500).optional().or(z.literal('')),
  });

// ── Inline TemplateForm — follows unified form pattern ────────────────────────

const TemplateForm: React.FC<{
  item:       TicketTemplate | null;
  onClose:    () => void;
  onSave:     (data: TicketTemplatePayload) => Promise<void>;
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
    resolver: zodResolver(createTemplateSchema(t)),
    mode: 'onBlur',
    defaultValues: {
      name:        item?.name        ?? '',
      description: item?.description ?? '',
    },
  });

  const { control, handleSubmit, formState: { isSubmitting } } = form;

  const firstInputRef  = useFocusInput({ inModal: true, enabled: true });
  const descriptionRef = useRef<any>(null);

  // ── Submit ────────────────────────────────────────────────────────────────
  const doSave = async (data: any) => {
    try {
      await onSave({ name: data.name, description: data.description || undefined });
      // ✅ Toast BEFORE onClose
      toast.success(item ? t('templates.messages.updated') : t('templates.messages.created'));
      onClose();
    } catch (err: any) {
      const serverMsg: string =
        err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';
      if (serverMsg.toLowerCase().includes('already exists')) {
        isDuplicateError.current = true;
        toast.error(t('templates.duplicateError.title'), t('templates.duplicateError.message'));
        return;
      }
      // All other errors: NetworkErrorDialog handles automatically
    }
  };

  return (
    <AdminFormModal
      open
      title={item ? t('templates.editTitle') : t('templates.addTitle')}
      onClose={onClose}
      onSubmit={handleSubmit(doSave)}
      submitting={submitting || isSubmitting}
    >
      <AppFormField name="name" control={control}>
        <AppTextInput
          inputRef={firstInputRef}
          nextRef={descriptionRef}
          label={t('templates.form.name')}
          placeholder={t('templates.form.namePlaceholder')}
          required
          autoCapitalize="words"
          maxLength={100}
          showClearButton
        />
      </AppFormField>
      <AppFormField name="description" control={control}>
        <AppTextInput
          inputRef={descriptionRef}
          label={t('templates.form.description')}
          placeholder={t('templates.form.descriptionPlaceholder')}
          autoCapitalize="sentences"
          maxLength={500}
          showClearButton
          multiline
          numberOfLines={3}
          blurOnSubmit
        />
      </AppFormField>
    </AdminFormModal>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const TemplatesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  const columns: ColDef<TicketTemplate>[] = [
    { field: 'name',           headerName: t('templates.columns.name'),           sortable: true  },
    { field: 'description',    headerName: t('templates.columns.description'),    width: 200, sortable: false },
    {
      field: 'priority', headerName: t('templates.columns.priority'), width: 100, align: 'center',
      renderCell: (row) => <AppBadge label={row.priority} variant="priority" size="small" />,
    },
    { field: 'estimatedHours', headerName: t('templates.columns.estimatedHours'), width: 100, align: 'center', sortable: true },
  ];

  const f = useAdminFeature<TicketTemplate, TicketTemplatePayload>({
    entityName: 'templates',
    queryKey:   ticketTemplatesKeys.all,
    api: {
      getAll:  ticketTemplatesApi.list.bind(ticketTemplatesApi),
      create:  ticketTemplatesApi.create.bind(ticketTemplatesApi),
      update:  ticketTemplatesApi.update.bind(ticketTemplatesApi),
      delete:  ticketTemplatesApi.remove.bind(ticketTemplatesApi),
    },
    messages: {
      success: {
        created: t('templates.messages.created'),
        updated: t('templates.messages.updated'),
        deleted: t('templates.messages.deleted'),
      },
      error: {
        create: t('templates.messages.errorCreate'),
        update: t('templates.messages.errorUpdate'),
        delete: t('templates.messages.errorDelete'),
      },
      titles: { create: t('templates.addTitle'), edit: t('templates.editTitle') },
    },
  });

  const handleFeatureError = (error: Error, errorInfo: any, errorId: string) => {
    handleError(error, {
      feature: 'templates',
      operation: 'feature-boundary',
      metadata: { errorId, componentStack: errorInfo.componentStack },
    });
  };

  return (
    <FeatureErrorBoundary featureName="Templates" onError={handleFeatureError}>
      <AdminCrudScreen<TicketTemplate>
        title={t('templates.title')}
        icon="📋"
        itemType={t('templates.itemType')}
        entities={f.entities}
        loading={f.loading}
        columns={columns}
        searchFields={['name']}
        getItemName={(tmpl) => tmpl.name}
        onDelete={(id) => f.remove(id)}
        onRefresh={f.refetch}
        searchPlaceholder={t('templates.searchPlaceholder')}
        emptyMessage={t('templates.emptyMessage')}
        emptyFilteredMessage={t('templates.emptyFilteredMessage')}
        addLabel={t('templates.addTitle')}
        refreshLabel={t('common.refresh')}
        refreshingLabel={t('common.refreshing')}
        deleteSuccessMessage={t('templates.messages.deleted')}
        renderForm={(item, onClose) => (
          <TemplateForm
            item={item}
            onClose={onClose}
            submitting={f.ui.submitting}
            onSave={async (data) => {
              // TemplateForm.doSave handles toast + duplicate detection + error
              if (item) await f.update(item.id, data);
              else      await f.create(data);
            }}
          />
        )}
      />
    </FeatureErrorBoundary>
  );
};

export default TemplatesScreen;
