import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { applicationsApi, applicationsKeys } from '../api/applications';
import { useUiStore } from '@/src/stores/uiStore';

interface Props {
  applicationId: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Set to false while a delete is in progress to prevent refetch of deleted resource */
  queryEnabled?: boolean;
}

/**
 * ApplicationDetailScreen — read-only detail view for a single application.
 * Shown when a row is tapped in the table/grid/compact view.
 */
const ApplicationDetailScreen: React.FC<Props> = ({ applicationId, onClose, onEdit, onDelete, queryEnabled = true }) => {
  const { t }      = useTranslation();
  const { colorMode } = useUiStore();
  const isDark     = colorMode === 'dark';

  const { data: app, isLoading } = useQuery({
    queryKey: applicationsKeys.detail(applicationId),
    queryFn:  () => applicationsApi.getApplication(applicationId),
    staleTime: 2 * 60_000,
    enabled:  queryEnabled,
  });

  const bg        = isDark ? '#0f172a' : '#f8fafc';
  const cardBg    = isDark ? '#1e293b' : '#ffffff';
  const border    = isDark ? '#334155' : '#e5e7eb';
  const textPri   = isDark ? '#f1f5f9' : '#111827';
  const textSec   = isDark ? '#94a3b8' : '#6b7280';
  const labelColor = isDark ? '#64748b' : '#9ca3af';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: border,
      }}>
        <Pressable
          onPress={onClose}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#334155' : '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: textSec, fontSize: 18 }}>←</Text>
        </Pressable>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: textPri }} numberOfLines={1}>
          {app?.name ?? t('applications.title')}
        </Text>
        <Pressable
          onPress={onEdit}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563eb' }}>✏️ {t('common.edit')}</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>🗑️ {t('common.delete')}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : !app ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: textSec }}>Application not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>

          {/* ── Main info card ── */}
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: border, padding: 16 }}>
            {/* Name */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: textPri }} numberOfLines={2}>
                {app.name}
              </Text>
            </View>

            {/* Version */}
            {app.version && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: labelColor, width: 80 }}>{t('applications.columns.version')}</Text>
                <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '600' }}>{app.version}</Text>
                </View>
              </View>
            )}

            {/* Created */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 12, color: labelColor, width: 80 }}>{t('applications.columns.created')}</Text>
              <Text style={{ fontSize: 13, color: textSec }}>{formatDate(app.createdAt)}</Text>
            </View>
          </View>

          {/* ── Description ── */}
          {app.description && (
            <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: border, padding: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 8 }}>
                {t('applications.form.description')}
              </Text>
              <Text style={{ fontSize: 14, color: textPri, lineHeight: 22 }}>{app.description}</Text>
            </View>
          )}

          {/* ── Stats ── */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: '#eff6ff', borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#1d4ed8' }}>{app._count?.tickets ?? 0}</Text>
              <Text style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>{t('applications.columns.tickets')}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0', padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#065f46' }}>{app._count?.customers ?? 0}</Text>
              <Text style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>{t('applications.columns.customers')}</Text>
            </View>
          </View>

        </ScrollView>
      )}
    </View>
  );
};

export default ApplicationDetailScreen;
