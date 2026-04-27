import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { useThemeColors } from '@/src/constants/theme';
import AdminDetailScreen from '@/src/features/admin/shared/AdminDetailScreen';
import DetailInfoCard    from '@/src/features/admin/shared/DetailInfoCard';
import DetailStatRow     from '@/src/features/admin/shared/DetailStatRow';
import { usersApi, usersKeys } from '../api/users';
import { ROLE_CONFIG, RoleBadge } from './userColumns';
import type { User } from '@/src/services/api/types';
import { PAGINATION } from '@/src/constants/api';

interface Props {
  userId:        string;
  onClose:       () => void;
  onEdit:        () => void;
  onDelete:      () => void;
  queryEnabled?: boolean;
  /** When true, use GET /users/:id (super admin). When false, use list cache only. */
  isSuperAdmin?: boolean;
  /** Pre-loaded user from the list — used as initial data for tenant admins */
  initialData?:  User | null;
}

const UserDetailScreen: React.FC<Props> = ({
  userId, onClose, onEdit, onDelete, queryEnabled = true,
  isSuperAdmin = false, initialData,
}) => {
  const { t }       = useTranslation();
  const c           = useThemeColors();
  const queryClient = useQueryClient();

  // Seed the cache with list data so the detail screen shows instantly
  // for tenant admins (who can't call GET /users/:id).
  React.useEffect(() => {
    if (!isSuperAdmin && initialData) {
      queryClient.setQueryData(usersKeys.detail(userId), initialData);
    }
  }, [isSuperAdmin, initialData, userId, queryClient]);

  const { data: user, isLoading } = useQuery({
    queryKey: usersKeys.detail(userId),
    // Super admins fetch full detail; tenant admins use the seeded list data only
    queryFn:  isSuperAdmin ? () => usersApi.getUser(userId) : () => Promise.resolve(initialData ?? null),
    staleTime: PAGINATION.DETAIL_STALE_TIME,
    enabled:  queryEnabled,
  });

  const roleCfg = user ? (ROLE_CONFIG[user.role] ?? { color: '#6b7280', bg: '#f9fafb', label: user.role }) : null;

  // Initials avatar
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <AdminDetailScreen
      title={user?.name ?? t('users.title')}
      isLoading={isLoading}
      notFound={!isLoading && !user}
      notFoundText={t('users.notFound')}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {user && roleCfg && (
        <>
          {/* ── Hero card ── */}
          <View style={[styles.heroCard, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>
            {/* Role-colored accent bar */}
            <View style={[styles.accentBar, { backgroundColor: roleCfg.color }]} />

            <View style={styles.heroBody}>
              <View style={styles.heroTop}>
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: roleCfg.color + '22' }]}>
                  <Text style={[styles.avatarText, { color: roleCfg.color }]}>{initials}</Text>
                </View>

                {/* Name + email */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.heroName, { color: c.text.primary }]} numberOfLines={2}>
                    {user.name}
                  </Text>
                  <Text style={[styles.heroEmail, { color: c.text.secondary }]} numberOfLines={1}>
                    ✉️  {user.email}
                  </Text>
                </View>

                {/* Role badge */}
                <RoleBadge role={user.role} />
              </View>

              {/* Quick info row */}
              {(user.phone || user.tenantName) && (
                <View style={[styles.infoRow, { borderTopColor: c.border.primary }]}>
                  {user.phone && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoIcon}>📞</Text>
                      <Text style={[styles.infoText, { color: c.text.secondary }]} numberOfLines={1}>
                        {user.phone}
                      </Text>
                    </View>
                  )}
                  {user.tenantName && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoIcon}>🏢</Text>
                      <Text style={[styles.infoText, { color: c.text.secondary }]} numberOfLines={1}>
                        {user.tenantName}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* ── Stats row ── */}
          <DetailStatRow
            stats={[
              { value: user._count?.assignedTickets ?? 0, label: t('users.detail.assignedTickets'), color: '#1d4ed8', bgColor: '#eff6ff' },
              { value: user._count?.createdTickets  ?? 0, label: t('users.detail.createdTickets'),  color: '#16a34a', bgColor: '#f0fdf4' },
              { value: user._count?.comments        ?? 0, label: t('users.detail.comments'),        color: '#7c3aed', bgColor: '#f5f3ff' },
            ]}
          />

          {/* ── Account info ── */}
          <DetailInfoCard
            title={t('users.detail.accountInfo')}
            fields={[
              { icon: '✉️', label: t('users.columns.email'),  value: user.email },
              { icon: '📞', label: t('users.columns.phone'),  value: user.phone },
              { icon: '🏢', label: t('users.detail.tenant'),  value: user.tenantName },
              {
                icon: '🎭',
                label: t('users.columns.role'),
                render: () => <RoleBadge role={user.role} />,
              },
              { icon: '📅', label: t('users.columns.created'), value: formatDate(user.createdAt) },
            ]}
          />

          {/* ── Notification settings ── */}
          {(user.reminderEnabled !== undefined || user.whatsappNotifications !== undefined) && (
            <DetailInfoCard
              title={t('users.detail.notifications')}
              fields={[
                {
                  icon: '🔔',
                  label: t('users.detail.reminders'),
                  value: user.reminderEnabled ? t('common.active') : t('common.inactive'),
                  valueColor: user.reminderEnabled ? c.intent.success : c.text.muted,
                },
                user.reminderEnabled && user.reminderInterval
                  ? { icon: '⏱️', label: t('users.detail.reminderInterval'), value: `${user.reminderInterval} min` }
                  : null,
                {
                  icon: '💬',
                  label: t('users.detail.whatsapp'),
                  value: user.whatsappNotifications ? t('common.active') : t('common.inactive'),
                  valueColor: user.whatsappNotifications ? c.intent.success : c.text.muted,
                },
              ].filter(Boolean) as any}
            />
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
  accentBar: { height: 4 },
  heroBody:  { padding: 16 },
  heroTop:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText:  { fontSize: 18, fontWeight: '800' },
  heroName:    { fontSize: 17, fontWeight: '800', lineHeight: 24 },
  heroEmail:   { fontSize: 12, marginTop: 3 },
  infoRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingTop: 12, borderTopWidth: 1,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  infoIcon: { fontSize: 13 },
  infoText: { fontSize: 12, flexShrink: 1 },
});

export default UserDetailScreen;
