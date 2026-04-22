import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminFeature } from '@/src/shared/hooks/useAdminFeature';
import { applicationsApi, applicationsKeys } from '../api/applications';
import { exportEntityPdf } from '@/src/shared/utils/exportEntityPdf';
import { getApplicationColumns } from '../components/applicationColumns';
import type { Application, CreateApplicationData } from '@/src/services/api/types';

export function useApplications() {
  const { t } = useTranslation();
  const [exporting,  setExporting]  = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Rebuild columns when language changes
  const columns = useMemo(() => getApplicationColumns(t), [t]);

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
        created: t('applications.messages.created'),
        updated: t('applications.messages.updated'),
        deleted: t('applications.messages.deleted'),
      },
      error: {
        create: t('applications.messages.errorCreate'),
        update: t('applications.messages.errorUpdate'),
        delete: t('applications.messages.errorDelete'),
      },
      titles: {
        create: t('applications.addTitle'),
        edit:   t('applications.editTitle'),
      },
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try { await exportEntityPdf(t('applications.title'), f.entities, columns); }
    finally { setExporting(false); }
  };

  return { f, columns, exporting, handleExport, selectedId, setSelectedId };
}
