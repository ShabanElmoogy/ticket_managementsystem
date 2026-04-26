import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { useThemeColors } from '@/src/constants/theme';
import AdminDetailScreen from '@/src/features/admin/shared/AdminDetailScreen';
import DetailInfoCard    from '@/src/features/admin/shared/DetailInfoCard';
import DetailStatRow     from '@/src/features/admin/shared/DetailStatRow';
import { customersApi, customersKeys } from '../api/customers';
import { getCustomerStatus, type SubscriptionStatus } from '../components/customerColumns';
import { PAGINATION } from '@/src/constants/api';

interface Props {
  customerId:    string;
  onClose:       () => void;
  onEdit:        () => void;
  onDelete:      () => void;
  queryEnabled?: boolean;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<SubscriptionStatus, { color: string; bg: string; label: string; icon: string }> = {
  ACTIVE:        { color: '#16a34a', bg: '#f0fdf4', label: 'Active',        icon: '✅' },
  TRIAL:         { color: '#7c3aed', bg: '#f5f3ff', label: 'Trial',         icon: '🔬' },
  EXPIRED:       { color: '#dc2626', bg: '#fef2f2', label: 'Expired',       icon: '⚠️' },
  INACTIVE:      { color: '#6b7280', bg: '#f9fafb', label: 'Inactive',      icon: '⏸️' },
  PAY_AS_YOU_GO: { color: '#0284c7', bg: '#f0f9ff', label: 'Pay As You Go', icon: '💳' },
};

const MAINTENANCE_LABELS: Record<string, string> = {
  MONTHLY_SUBSCRIPTION: 'Monthly Subscription',
  FREE_TRIAL:           'Free Trial',
  PAY_AS_YOU_GO:        'Pay As You Go',
};

// ── Component ─────────────────────────────────────────────────────────────────

const CustomerDetailScreen: React.FC<Props> = ({
  customerId, onClose, onEdit, onDelete, queryEnabled = true,
}) => {
  const { t }  = useTranslation();
  const c      = useThemeColors();

  const { data: customer, isLoading } = useQuery({
    queryKey: customersKeys.detail(customerId),
    queryFn:  () => customersApi.getCustomer(customerId),
    staleTime: PAGINATION.DETAIL_STALE_TIME,
    enabled:  queryEnabled,
  });

  const border     = c.border.primary;
  const cardBg     = c.surface.primary;
  const textPri    = c.text.primary;
  const textSec    = c.text.secondary;
  const labelColor = c.text.muted;

  const status = customer
    ? ((customer.subscriptionStatus as SubscriptionStatus | undefined) ?? getCustomerStatus(customer))
    : 'INACTIVE';
  const statusCfg = STATUS_CFG[status];

  // Initials avatar
  const initials = customer?.name
    ? customer.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <AdminDetailScreen
      title={customer?.name ?? t('customers.title')}
      subtitle={customer?.company ?? undefined}
      isLoading={isLoading}
      notFound={!isLoading && !customer}
      notFoundText={t('customers.notFound')}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {customer && (
        <>
          {/* ── Hero card ── */}
          <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: border }]}>
            {/* Status accent bar */}
            <View style={[styles.accentBar, { backgroundColor: statusCfg.color }]} />

            <View style={styles.heroBody}>
              {/* Avatar + name + status */}
              <View style={styles.heroTop}>
                <View style={[styles.avatar, { backgroundColor: statusCfg.color + '22' }]}>
                  <Text style={[styles.avatarText, { color: statusCfg.color }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.heroName, { color: textPri }]} numberOfLines={2}>
                    {customer.name}
                  </Text>
                  {customer.company && (
                    <Text style={[styles.heroCompany, { color: textSec }]} numberOfLines={1}>
                      🏢  {customer.company}
                    </Text>
                  )}
                </View>
                {/* Status badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.color + '44' }]}>
                  <Text style={{ fontSize: 12 }}>{statusCfg.icon}</Text>
                  <Text style={[styles.statusLabel, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                </View>
              </View>

              {/* Quick contact row */}
              <View style={[styles.contactRow, { borderTopColor: border }]}>
                {customer.email && (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactIcon}>✉️</Text>
                    <Text style={[styles.contactText, { color: textSec }]} numberOfLines={1}>
                      {customer.email}
                    </Text>
                  </View>
                )}
                {customer.phone && (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactIcon}>📞</Text>
                    <Text style={[styles.contactText, { color: textSec }]} numberOfLines={1}>
                      {customer.phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── Stats row ── */}
          <DetailStatRow
            stats={[
              { value: customer._count?.tickets ?? 0,      label: t('customers.columns.tickets'),      color: '#1d4ed8', bgColor: '#eff6ff' },
              { value: customer.applications?.length ?? 0, label: t('customers.detail.applications'),  color: '#065f46', bgColor: '#f0fdf4' },
            ]}
          />

          {/* ── Contact & address ── */}
          <DetailInfoCard
            title={t('customers.detail.contact') ?? 'Contact'}
            fields={[
              { icon: '✉️', label: t('customers.columns.email'),  value: customer.email },
              { icon: '📞', label: t('customers.columns.phone'),  value: customer.phone },
              { icon: '🏢', label: t('customers.detail.company'), value: customer.company },
              { icon: '📍', label: t('customers.detail.address'), value: customer.address },
              { icon: '📅', label: t('customers.columns.created'), value: formatDate(customer.createdAt) },
            ]}
          />

          {/* ── Subscription ── */}
          {customer.maintenanceType && (
            <DetailInfoCard
              title={t('customers.detail.maintenance')}
              fields={[
                { icon: '📋', label: t('customers.detail.maintenanceType'),   value: MAINTENANCE_LABELS[customer.maintenanceType] ?? customer.maintenanceType },
                { icon: '▶️', label: t('customers.detail.subscriptionStart'), value: customer.subscriptionStartDate ? formatDate(customer.subscriptionStartDate) : null },
                (() => {
                  const endDate  = customer.subscriptionEndDate;
                  const end      = endDate ? new Date(endDate) : null;
                  const now      = new Date();
                  const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const isExpired = daysLeft !== null && daysLeft < 0;
                  const isSoon    = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
                  const color     = isExpired ? '#dc2626' : isSoon ? '#d97706' : undefined;
                  return {
                    icon: '⏹️',
                    label: t('customers.detail.subscriptionEnd'),
                    value: endDate ? formatDate(endDate) : null,
                    valueColor: color,
                  };
                })(),
              ]}
            />
          )}

          {/* ── Linked applications ── */}
          {!!customer.applications?.length && (
            <View style={[styles.appsCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={[styles.appsTitleRow, { borderBottomColor: border }]}>
                <Text style={[styles.appsTitle, { color: labelColor }]}>
                  📱  {t('customers.detail.applications')}
                </Text>
                <View style={styles.appsBadge}>
                  <Text style={styles.appsBadgeText}>{customer.applications.length}</Text>
                </View>
              </View>
              {customer.applications.map((ca: any, i: number) => (
                <View
                  key={ca.id}
                  style={[
                    styles.appRow,
                    i < customer.applications.length - 1 && { borderBottomWidth: 1, borderBottomColor: border },
                  ]}
                >
                  <View style={styles.appIcon}>
                    <Text style={{ fontSize: 14 }}>📦</Text>
                  </View>
                  <Text style={[styles.appName, { color: textPri }]} numberOfLines={1}>
                    {ca.application?.name ?? ca.applicationId}
                  </Text>
                  {ca.application?.version && (
                    <View style={styles.versionBadge}>
                      <Text style={styles.versionText}>{ca.application.version}</Text>
                    </View>
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
  // Hero card
  heroCard: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  accentBar: { height: 4 },
  heroBody:  { padding: 16 },
  heroTop:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText:   { fontSize: 18, fontWeight: '800' },
  heroName:     { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  heroCompany:  { fontSize: 12, marginTop: 3 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
    flexShrink: 0,
  },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  contactRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingTop: 12, borderTopWidth: 1,
  },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  contactIcon: { fontSize: 13 },
  contactText: { fontSize: 12, flexShrink: 1 },

  // Apps card
  appsCard: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  appsTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  appsTitle:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  appsBadge:     { backgroundColor: '#3b82f620', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  appsBadgeText: { fontSize: 11, fontWeight: '700', color: '#3b82f6' },
  appRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  appIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  appName:      { flex: 1, fontSize: 13, fontWeight: '600' },
  versionBadge: {
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  versionText: { color: '#1d4ed8', fontSize: 11, fontWeight: '600' },
});

export default CustomerDetailScreen;
