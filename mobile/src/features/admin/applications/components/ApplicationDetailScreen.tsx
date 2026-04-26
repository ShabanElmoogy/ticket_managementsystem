import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { useThemeColors } from '@/src/constants/theme';
import AdminDetailScreen from '@/src/features/admin/shared/AdminDetailScreen';
import DetailInfoCard    from '@/src/features/admin/shared/DetailInfoCard';
import DetailStatRow     from '@/src/features/admin/shared/DetailStatRow';
import { applicationsApi, applicationsKeys } from '../api/applications';
import { PAGINATION } from '@/src/constants/api';

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
  const c      = useThemeColors();

  const { data: app, isLoading } = useQuery({
    queryKey: applicationsKeys.detail(applicationId),
    queryFn:  () => applicationsApi.getApplication(applicationId),
    staleTime: PAGINATION.DETAIL_STALE_TIME,
    enabled:  queryEnabled,
  });

  const border     = c.border.primary;
  const cardBg     = c.surface.primary;
  const textPri    = c.text.primary;
  const textSec    = c.text.secondary;
  const labelColor = c.text.muted;

  // Initials from app name
  const initials = app?.name
    ? app.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <AdminDetailScreen
      title={app?.name ?? t('applications.title')}
      subtitle={app?.version ? `v${app.version}` : undefined}
      isLoading={isLoading}
      notFound={!isLoading && !app}
      notFoundText={t('applications.notFound')}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {app && (
        <>
          {/* ── Hero card ── */}
          <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: border }]}>
            {/* Blue accent bar */}
            <View style={styles.accentBar} />

            <View style={styles.heroBody}>
              <View style={styles.heroTop}>
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                {/* Name + version */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.heroName, { color: textPri }]} numberOfLines={2}>
                    {app.name}
                  </Text>
                  {app.version && (
                    <View style={styles.versionRow}>
                      <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>v{app.version}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Created date */}
              <View style={[styles.metaRow, { borderTopColor: border }]}>
                <Text style={styles.metaIcon}>📅</Text>
                <Text style={[styles.metaText, { color: textSec }]}>
                  {t('applications.columns.created')}:  {formatDate(app.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Stats ── */}
          <DetailStatRow
            stats={[
              { value: app._count?.tickets   ?? 0, label: t('applications.columns.tickets'),   color: '#1d4ed8', bgColor: '#eff6ff' },
              { value: app._count?.customers ?? 0, label: t('applications.columns.customers'), color: '#065f46', bgColor: '#f0fdf4' },
            ]}
          />

          {/* ── Details ── */}
          <DetailInfoCard
            title={t('applications.title')}
            fields={[
              { icon: '📱', label: t('applications.columns.name'),    value: app.name },
              { icon: '🏷️', label: t('applications.columns.version'), value: app.version },
              { icon: '📅', label: t('applications.columns.created'), value: formatDate(app.createdAt) },
            ]}
          />

          {/* ── Description ── */}
          {!!app.description && (
            <View style={[styles.descCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={[styles.descTitleRow, { borderBottomColor: border }]}>
                <Text style={[styles.descTitle, { color: labelColor }]}>
                  📝  {t('applications.form.description')}
                </Text>
              </View>
              <Text style={[styles.descText, { color: textSec }]}>
                {app.description}
              </Text>
            </View>
          )}

          {/* ── Linked customers ── */}
          {!!app.customers?.length && (
            <View style={[styles.listCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={[styles.listTitleRow, { borderBottomColor: border }]}>
                <Text style={[styles.listTitle, { color: labelColor }]}>
                  👥  {t('applications.columns.customers')}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{app.customers.length}</Text>
                </View>
              </View>
              {app.customers.map((ca: any, i: number) => (
                <View
                  key={ca.id}
                  style={[
                    styles.listRow,
                    i < app.customers.length - 1 && { borderBottomWidth: 1, borderBottomColor: border },
                  ]}
                >
                  <View style={styles.listIcon}>
                    <Text style={{ fontSize: 14 }}>👤</Text>
                  </View>
                  <Text style={[styles.listName, { color: textPri }]} numberOfLines={1}>
                    {ca.customer?.name ?? ca.customerId}
                  </Text>
                  {ca.customer?.email && (
                    <Text style={[styles.listSub, { color: textSec }]} numberOfLines={1}>
                      {ca.customer.email}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </AdminDetailScreen>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  accentBar: { height: 4, backgroundColor: '#3b82f6' },
  heroBody:  { padding: 16 },
  heroTop:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText:   { fontSize: 18, fontWeight: '800', color: '#2563eb' },
  heroName:     { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  versionRow:   { flexDirection: 'row', marginTop: 6 },
  versionBadge: {
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  versionText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 12, borderTopWidth: 1,
  },
  metaIcon: { fontSize: 13 },
  metaText: { fontSize: 12 },

  // Description card
  descCard: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  descTitleRow: {
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  descTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  descText:  { padding: 16, fontSize: 14, lineHeight: 22 },

  // Generic list card (customers)
  listCard: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  listTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  listTitle:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  countBadge:   { backgroundColor: '#3b82f620', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  countText:    { fontSize: 11, fontWeight: '700', color: '#3b82f6' },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  listIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  listName: { flex: 1, fontSize: 13, fontWeight: '600' },
  listSub:  { fontSize: 11, flexShrink: 1 },
});

export default ApplicationDetailScreen;
