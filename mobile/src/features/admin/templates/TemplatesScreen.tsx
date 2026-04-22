import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { ticketTemplatesApi, ticketTemplatesKeys, type TicketTemplatePayload } from './api/templates';
import AdminCrudScreen  from '../shared/AdminCrudScreen';
import AdminFormModal   from '../shared/AdminFormModal';
import { AppTextInput, AppBadge } from '../../../shared/components';
import type { TicketTemplate } from '../../../services/api/types';
import type { ColDef } from '../../../shared/components';

// ── Inline form ───────────────────────────────────────────────────────────────

const TemplateForm: React.FC<{
  item:       TicketTemplate | null;
  onClose:    () => void;
  onSave:     (data: TicketTemplatePayload) => Promise<void>;
  submitting: boolean;
}> = ({ item, onClose, onSave, submitting }) => {
  const { t } = useTranslation();
  const [name,        setName]        = useState(item?.name        ?? '');
  const [description, setDescription] = useState(item?.description ?? '');

  return (
    <AdminFormModal
      open
      title={item ? t('templates.editTitle') : t('templates.addTitle')}
      onClose={onClose}
      onSubmit={() => onSave({ name, description: description || undefined })}
      submitting={submitting}
    >
      <AppTextInput
        label={t('templates.form.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('templates.form.namePlaceholder')}
        autoCapitalize="words"
      />
      <AppTextInput
        label={t('templates.form.description')}
        value={description}
        onChangeText={setDescription}
        placeholder={t('templates.form.descriptionPlaceholder')}
        autoCapitalize="sentences"
      />
    </AdminFormModal>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const TemplatesScreen: React.FC = () => {
  const { t } = useTranslation();

  const columns: ColDef<TicketTemplate>[] = [
    { field: 'name',           headerName: t('templates.columns.name'),           flex: 1,   sortable: true  },
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

  return (
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
            if (item) await f.update(item.id, data);
            else      await f.create(data);
            onClose();
          }}
        />
      )}
    />
  );
};

export default TemplatesScreen;
