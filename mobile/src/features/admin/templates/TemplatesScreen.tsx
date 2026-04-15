import React, { useState } from 'react';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { ticketTemplatesApi, ticketTemplatesKeys, type TicketTemplatePayload } from './api/templates';
import AdminCrudScreen from '../shared/AdminCrudScreen';
import AdminFormModal from '../shared/AdminFormModal';
import AppTextInput from '../../../shared/components/AppTextInput';
import AppBadge from '../../../shared/components/AppBadge';
import type { TicketTemplate } from '../../../services/api/types';
import type { ColDef } from '../../../shared/components/AppDataTable';

const COLUMNS: ColDef<TicketTemplate>[] = [
  { field: 'name',        headerName: 'Name',        flex: 1,   sortable: true },
  { field: 'description', headerName: 'Description', width: 200, sortable: false },
  {
    field: 'priority', headerName: 'Priority', width: 100, align: 'center',
    renderCell: (row) => <AppBadge label={row.priority} variant="priority" size="small" />,
  },
  { field: 'estimatedHours', headerName: 'Est. Hours', width: 100, align: 'center', sortable: true },
];

const TemplateForm: React.FC<{
  item: TicketTemplate | null; onClose: () => void;
  onSave: (data: TicketTemplatePayload) => Promise<void>; submitting: boolean;
}> = ({ item, onClose, onSave, submitting }) => {
  const [name,        setName]        = useState(item?.name        ?? '');
  const [description, setDescription] = useState(item?.description ?? '');

  return (
    <AdminFormModal open title={item ? 'Edit Template' : 'Add Template'} onClose={onClose}
      onSubmit={() => onSave({ name, description: description || undefined })} submitting={submitting}
    >
      <AppTextInput label="Name *"      value={name}        onChangeText={setName}        placeholder="Template name" />
      <AppTextInput label="Description" value={description} onChangeText={setDescription} placeholder="Brief description" />
    </AdminFormModal>
  );
};

const TemplatesScreen: React.FC = () => {
  const f = useAdminFeature<TicketTemplate, TicketTemplatePayload>({
    entityName: 'templates', queryKey: ticketTemplatesKeys.all,
    api: {
      getAll:  ticketTemplatesApi.list.bind(ticketTemplatesApi),
      create:  ticketTemplatesApi.create.bind(ticketTemplatesApi),
      update:  ticketTemplatesApi.update.bind(ticketTemplatesApi),
      delete:  ticketTemplatesApi.remove.bind(ticketTemplatesApi),
    },
    messages: {
      success: { created: 'Template created', updated: 'Template updated', deleted: 'Template deleted' },
      error:   { create: 'Error creating', update: 'Error updating', delete: 'Error deleting' },
      titles:  { create: 'Add Template', edit: 'Edit Template' },
    },
  });

  return (
    <AdminCrudScreen<TicketTemplate>
      title="Templates" icon="📋" itemType="template"
      entities={f.entities} loading={f.loading}
      columns={COLUMNS} searchFields={['name']}
      getItemName={(t) => t.name} onDelete={(id) => f.remove(id)}
      renderForm={(item, onClose) => (
        <TemplateForm item={item} onClose={onClose} submitting={f.ui.submitting}
          onSave={async (data) => { if (item) await f.update(item.id, data); else await f.create(data); onClose(); }}
        />
      )}
    />
  );
};

export default TemplatesScreen;
