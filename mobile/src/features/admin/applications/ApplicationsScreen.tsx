import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { applicationsApi, applicationsKeys } from './api/applications';
import { applicationFormSchema } from './schemas/applicationSchema';
import AdminCrudScreen from '../shared/AdminCrudScreen';
import AdminFormModal from '../shared/AdminFormModal';
import AppTextInput from '../../../shared/components/AppTextInput';
import AppBadge from '../../../shared/components/AppBadge';
import { formatDate, formatRelativeDuration } from '../../../shared/utils/dateUtils';
import type { Application, CreateApplicationData } from '../../../services/api/types';
import type { ColDef } from '../../../shared/components/AppDataTable';

// ── Column definitions — mirrors web ApplicationsColumns.tsx ───────────────

const COLUMNS: ColDef<Application>[] = [
  {
    field: 'name',
    headerName: 'Name',
    flex: 1,
    sortable: true,
  },
  {
    field: 'version',
    headerName: 'Version',
    width: 90,
    sortable: true,
    renderCell: (row) => (
      <View className="bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
        <Text className="text-blue-700 text-xs font-mono">{row.version ?? '—'}</Text>
      </View>
    ),
  },
  {
    field: 'isActive',
    headerName: 'Status',
    width: 90,
    align: 'center',
    renderCell: (row) => (
      <AppBadge
        label={row.isActive ? 'ACTIVE' : 'INACTIVE'}
        color={row.isActive ? '#10b981' : '#6b7280'}
        size="small"
      />
    ),
  },
  {
    field: '_count',
    headerName: 'Tickets',
    width: 70,
    align: 'center',
    valueGetter: (row) => row._count?.tickets ?? 0,
    renderCell: (row) => {
      const count = row._count?.tickets ?? 0;
      return (
        <View className="bg-blue-100 rounded-full px-2 py-0.5 min-w-[28px] items-center">
          <Text className="text-blue-700 text-xs font-bold">{count}</Text>
        </View>
      );
    },
  },
  {
    field: '_countCustomers',
    headerName: 'Customers',
    width: 80,
    align: 'center',
    valueGetter: (row) => row._count?.customers ?? 0,
    renderCell: (row) => {
      const count = row._count?.customers ?? 0;
      return (
        <View className="bg-green-100 rounded-full px-2 py-0.5 min-w-[28px] items-center">
          <Text className="text-green-700 text-xs font-bold">{count}</Text>
        </View>
      );
    },
  },
  {
    field: 'createdAt',
    headerName: 'Created',
    width: 100,
    align: 'center',
    renderCell: (row) => (
      <Text className="text-gray-500 text-xs">
        {row.createdAt ? formatDate(row.createdAt) : '—'}
      </Text>
    ),
  },
];

// ── Form — mirrors web ApplicationFormDialog.tsx ───────────────────────────

interface ApplicationFormProps {
  item: Application | null;
  onClose: () => void;
  onSave: (data: CreateApplicationData) => Promise<void>;
  submitting: boolean;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  item, onClose, onSave, submitting,
}) => {
  const [name,        setName]        = useState(item?.name        ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [version,     setVersion]     = useState(item?.version     ?? '');
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    // Validate with Zod schema (same as web)
    const result = applicationFormSchema.safeParse({ name, description, version });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[String(e.path[0])] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSave({
      name: result.data.name,
      description: result.data.description || undefined,
      version:     result.data.version     || undefined,
    });
  };

  return (
    <AdminFormModal
      open
      title={item ? 'Edit Application' : 'Add Application'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      <AppTextInput
        label="Name *"
        value={name}
        onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
        placeholder="Application name"
        error={errors.name}
        autoCapitalize="words"
      />
      <AppTextInput
        label="Version"
        value={version}
        onChangeText={(v) => { setVersion(v); setErrors((e) => ({ ...e, version: '' })); }}
        placeholder="1.0.0"
        error={errors.version}
        autoCapitalize="none"
      />
      <AppTextInput
        label="Description"
        value={description}
        onChangeText={(v) => { setDescription(v); setErrors((e) => ({ ...e, description: '' })); }}
        placeholder="Brief description of the application"
        error={errors.description}
        autoCapitalize="sentences"
      />
    </AdminFormModal>
  );
};

// ── Main screen — mirrors web ApplicationsManagement.tsx ───────────────────

const ApplicationsScreen: React.FC = () => {
  const f = useAdminFeature<Application, CreateApplicationData>({
    entityName: 'applications',
    queryKey: applicationsKeys.all,
    api: {
      getAll:  applicationsApi.getApplications.bind(applicationsApi),
      create:  applicationsApi.createApplication.bind(applicationsApi),
      update:  applicationsApi.updateApplication.bind(applicationsApi),
      delete:  applicationsApi.deleteApplication.bind(applicationsApi),
    },
    messages: {
      success: {
        created: 'Application created successfully',
        updated: 'Application updated successfully',
        deleted: 'Application deleted successfully',
      },
      error: {
        create: 'Error creating application',
        update: 'Error updating application',
        delete: 'Error deleting application',
      },
      titles: {
        create: 'Add Application',
        edit:   'Edit Application',
      },
    },
  });

  return (
    <AdminCrudScreen<Application>
      title="Applications"
      icon="📱"
      itemType="application"
      entities={f.entities}
      loading={f.loading}
      columns={COLUMNS}
      searchFields={['name', 'version', 'description']}
      getItemName={(a) => a.name}
      onDelete={(id) => f.remove(id)}
      renderForm={(item, onClose) => (
        <ApplicationForm
          item={item}
          onClose={onClose}
          submitting={f.ui.submitting}
          onSave={async (data) => {
            if (item) await f.update(item.id, data as any);
            else      await f.create(data);
            onClose();
          }}
        />
      )}
    />
  );
};

export default ApplicationsScreen;
