import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { useIsDark } from '@/src/constants/theme';
import AdminDetailScreen from '@/src/features/admin/shared/AdminDetailScreen';
import DetailInfoCard from '@/src/features/admin/shared/DetailInfoCard';
import DetailStatRow from '@/src/features/admin/shared/DetailStatRow';
import { applicationsApi, applicationsKeys } from '../api/applications';

interface Props {
  applicationId: string;
  onClose:       () => void;
  onEdit:        () => void;
  onDelete:      () => void;
  queryEnabled?: boolean;
}

const ApplicationDetailScreen: React.FC<Props> = ({
  applicationId, onClose, onEdit, onDelete, queryEnabled = true,
}) => {
  const { t }  = useTranslation();
  const isDark = useIsDark();

  const { data: app, isLoading } = useQuery({
    queryKey: applicationsKeys.detail(applicationId),
    queryFn:  () => applicationsApi.getApplication(applicationId),
    staleTime: 2 * 60_000,
    enabled:  queryEnabled,
  });

  const textPri = isDark ? '#f1f5f9' : '#111827';

  return (
    <AdminDetailScreen
      title={app?.name ?? t('applications.title')}
      isLoading={isLoading}
      notFound={!isLoading && !app}
      notFoundText={t('applications.notFound')}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {app && (
        <>
          {/* ── Main info — all columns ── */}
          <DetailInfoCard
            fields={[
              {
                label: t('applications.columns.name'),
                render: () => (
                  <Text style={{ fontSize: 18, fontWeight: '800', color: textPri }}>
                    {app.name}
                  </Text>
                ),
              },
              {
                label: t('applications.columns.version'),
                render: app.version ? () => (
                  <View style={{
                    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
                    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
                  }}>
                    <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '600' }}>
                      {app.version}
                    </Text>
                  </View>
                ) : undefined,
                value: app.version ? undefined : null,
              },
              { label: t('applications.columns.created'), value: formatDate(app.createdAt) },
            ]}
          />

          {/* ── Description ── */}
          {!!app.description && (
            <DetailInfoCard
              title={t('applications.form.description')}
              fields={[{ label: '', value: app.description }]}
            />
          )}

          {/* ── Stats: tickets + customers ── */}
          <DetailStatRow
            stats={[
              {
                value:   app._count?.tickets   ?? 0,
                label:   t('applications.columns.tickets'),
                color:   '#1d4ed8',
                bgColor: '#eff6ff',
              },
              {
                value:   app._count?.customers ?? 0,
                label:   t('applications.columns.customers'),
                color:   '#065f46',
                bgColor: '#f0fdf4',
              },
            ]}
          />
        </>
      )}
    </AdminDetailScreen>
  );
};

export default ApplicationDetailScreen;
