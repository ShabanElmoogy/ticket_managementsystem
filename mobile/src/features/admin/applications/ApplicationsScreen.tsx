import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminCrudScreen  from '@/src/features/admin/shared/AdminCrudScreen';
import ApplicationForm  from './components/ApplicationForm';
import { useApplications } from './hooks/useApplications';
import type { Application, CreateApplicationData } from '@/src/services/api/types';

const ApplicationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { f, columns, exporting, handleExport } = useApplications();

  return (
    <AdminCrudScreen<Application>
      title={t('applications.title')}
      icon="📱"
      itemType={t('applications.itemType')}
      entities={f.entities}
      loading={f.loading}
      columns={columns}
      searchFields={['name', 'version', 'description']}
      getItemName={(a) => a.name}
      onDelete={(id) => f.remove(id)}
      onRefresh={f.refetch}
      onExport={handleExport}
      exporting={exporting}
      searchPlaceholder={t('applications.searchPlaceholder')}
      emptyMessage={t('applications.emptyMessage')}
      emptyFilteredMessage={t('applications.emptyFilteredMessage')}
      addLabel={t('applications.addTitle')}
      exportLabel={t('common.exportPdf')}
      exportingLabel={t('common.exporting')}
      refreshLabel={t('common.refresh')}
      refreshingLabel={t('common.refreshing')}
      deleteSuccessMessage={t('applications.messages.deleted')}
      renderForm={(item, onClose) => (
        <ApplicationForm
          item={item}
          onClose={onClose}
          submitting={f.ui.submitting}
          mode="page"
          onSave={async (data: CreateApplicationData) => {
            if (item) await f.update(item.id, data);
            else      await f.create(data);
            onClose();
          }}
        />
      )}
    />
  );
};

export default ApplicationsScreen;
