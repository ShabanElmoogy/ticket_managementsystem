import React, { useState } from 'react';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { applicationsApi, applicationsKeys } from './api/applications';
import AdminCrudScreen from '../shared/AdminCrudScreen';
import AdminFormModal from '../shared/AdminFormModal';
import AppTextInput from '../../../shared/components/AppTextInput';
import AppBadge from '../../../shared/components/AppBadge';
import type { Application, CreateApplicationData } from '../../../services/api/types';
import type { ColDef } from '../../../shared/components/AppDataTable';

const COLUMNS: ColDef<Application>[] = [
  { field: 'name',        headerName: 'Name',    flex: 1,   sortable: true },
  { field: 'version',     headerName: 'Version', width: 90, sortable: true },
  { field: 'description', headerName: 'Description', width: 200, sortable: false },
  {
    field: 'isActive', headerName: 'Status', width: 90, align: 'center',
    renderCell: (row) => <AppBadge label={row.isActive ? 'ACTIVE' : 'INACTIVE'} color={row.isActive ? '#10b981' : '#6b7280'} size="small" />,
  },
  {
    field: '_count', headerName: 'Tickets', width: 80, align: 'center',
    valueGetter: (row) => row._count?.tickets ?? 0,
  },
];

const ApplicationForm: React.FC<{
  item: Application | null; onClose: () => void;
  onSave: (data: CreateApplicationData) => Promise<void>; submitting: boolean;
}> = ({ item, onClose, onSave, submitting }) => {
  const [name,        setName]        = useState(item?.name        ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [version,     setVersion]     = useState(item?.version     ?? '');

  return (
    <AdminFormModal open title={item ? 'Edit Application' : 'Add Application'} onClose={onClose}
      onSubmit={() => onSave({ name, description: description || undefined, version: version || undefined })}
      submitting={submitting}
    >
      <AppTextInput label="Name *"      value={name}        onChangeText={setName}        placeholder="App name" />
      <AppTextInput label="Version"     value={version}     onChangeText={setVersion}     placeholder="1.0.0" />
      <AppTextInput label="Description" value={description} onChangeText={setDescription} placeholder="Brief description" />
    </AdminFormModal>
  );
};

const ApplicationsScreen: React.FC = () => {
  const f = useAdminFeature<Application, CreateApplicationData>({
    entityName: 'applications', queryKey: applicationsKeys.all,
    api: {
      getAll:  applicationsApi.getApplications.bind(applicationsApi),
      create:  applicationsApi.createApplication.bind(applicationsApi),
      update:  applicationsApi.updateApplication.bind(applicationsApi),
      delete:  applicationsApi.deleteApplication.bind(applicationsApi),
    },
    messages: {
      success: { created: 'Application created', updated: 'Application updated', deleted: 'Application deleted' },
      error:   { create: 'Error creating', update: 'Error updating', delete: 'Error deleting' },
      titles:  { create: 'Add Application', edit: 'Edit Application' },
    },
  });

  return (
    <AdminCrudScreen<Application>
      title="Applications" icon="📱" itemType="application"
      entities={f.entities} loading={f.loading}
      columns={COLUMNS} searchFields={['name']}
      getItemName={(a) => a.name} onDelete={(id) => f.remove(id)}
      renderForm={(item, onClose) => (
        <ApplicationForm item={item} onClose={onClose} submitting={f.ui.submitting}
          onSave={async (data) => { if (item) await f.update(item.id, data); else await f.create(data); onClose(); }}
        />
      )}
    />
  );
};

export default ApplicationsScreen;
