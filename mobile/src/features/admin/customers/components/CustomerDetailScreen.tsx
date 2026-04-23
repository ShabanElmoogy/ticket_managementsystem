import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { AppBadge } from '@/src/shared/components';
import { useIsDark } from '@/src/constants/theme';
import AdminDetailScreen from '@/src/features/admin/shared/AdminDetailScreen';
import DetailInfoCard from '@/src/features/admin/shared/DetailInfoCard';
import DetailStatRow from '@/src/features/admin/shared/DetailStatRow';
import { customersApi, customersKeys } from '../api/customers';
import { getCustomerStatus, type SubscriptionStatus } from '../components/customerColumns';

interface Props {
  customerId:    string;
  onClose:       () => void;
  onEdit:        () => void;
  onDelete:      () => void;
  queryEnabled?: boolean;
}

const CustomerDetailScreen: React.FC<Props> = ({
  customerId, onClose, onEdit, onDelete, queryEnabled = true,
}) => {
  const { t }  = useTranslation();
  const isDark = useIsDark();

  const { data: customer, isLoading } = useQuery({
    queryKey: customersKeys.detail(customerId),
    queryFn:  () => customersApi.getCustomer(customerId),
    staleTime: 2 * 60_000,
    enabled:  queryEnabled,
  });

  const border     = isDark ? '#334155' : '#e5e7eb';
  const cardBg     = isDark ? '#1e293b' : '#ffffff';
  const textPri    = isDark ? '#f1f5f9' : '#111827';
  const textSec    = isDark ? '#94a3b8' : '#6b7280';
  const labelColor = isDark ? '#64748b' : '#9ca3af';

  // Compute status client-side (same logic as API) — use server value if present
  const STATUS_COLORS: Record<SubscriptionStatus, { color: string; bg: string }> = {
    ACTIVE:        { color: '#16a34a', bg: '#f0fdf4' },
    TRIAL:         { color: '#7c3aed', bg: '#f5f3ff' },
    EXPIRED:       { color: '#dc2626', bg: '#fef2f2' },
    INACTIVE:      { color: '#6b7280', bg: '#f9fafb' },
    PAY_AS_YOU_GO: { color: '#0284c7', bg: '#f0f9ff' },
  };
  const STATUS_LABELS: Record<SubscriptionStatus, string> = {
    ACTIVE: 'Active', TRIAL: 'Trial', EXPIRED: 'Expired',
    INACTIVE: 'Inactive', PAY_AS_YOU_GO: 'Pay As You Go',
  };

  const getStatusBadge = (c: typeof customer) => {
    if (!c) return null;
    const status = (c.subscriptionStatus as SubscriptionStatus | undefined) ?? getCustomerStatus(c);
    const cfg = STATUS_COLORS[status];
    return (
      <View style={{
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
        backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color + '44',
      }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>
          {STATUS_LABELS[status]}
        </Text>
      </View>
    );
  };

  return (
    <AdminDetailScreen
      title={customer?.name ?? t('customers.title')}
      isLoading={isLoading}
      notFound={!isLoading && !customer}
      notFoundText={t('customers.notFound')}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {customer && (
        <>
          {/* ── Main info — all columns ── */}
          <DetailInfoCard
            fields={[
              {
                label: t('customers.columns.name'),
                render: () => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: textPri }}>
                      {customer.name}
                    </Text>
                    {getStatusBadge(customer)}
                  </View>
                ),
              },
              { label: t('customers.columns.email'),   value: customer.email },
              { label: t('customers.columns.phone'),   value: customer.phone },
              { label: t('customers.detail.company'),  value: customer.company },
              { label: t('customers.detail.address'),  value: customer.address },
              {
                label: t('customers.detail.maintenanceType'),
                value: customer.maintenanceType
                  ? ({ MONTHLY_SUBSCRIPTION: 'Monthly Subscription', FREE_TRIAL: 'Free Trial', PAY_AS_YOU_GO: 'Pay As You Go' } as Record<string, string>)[customer.maintenanceType]
                  : null,
              },
              { label: t('customers.columns.created'), value: formatDate(customer.createdAt) },
            ]}
          />

          {/* ── Description ── */}
          {!!customer.description && (
            <DetailInfoCard
              title={t('common.description')}
              fields={[{ label: '', value: customer.description }]}
            />
          )}

          {/* ── Maintenance / subscription ── */}
          {customer.maintenanceType && (
            <DetailInfoCard
              title={t('customers.detail.maintenance')}
              fields={[
                { label: t('customers.detail.maintenanceType'),   value: customer.maintenanceType },
                {
                  label: t('customers.detail.subscriptionStart'),
                  value: customer.subscriptionStartDate ? formatDate(customer.subscriptionStartDate) : null,
                },
                {
                  label: t('customers.detail.subscriptionEnd'),
                  value: customer.subscriptionEndDate ? formatDate(customer.subscriptionEndDate) : null,
                },
              ]}
            />
          )}

          {/* ── Linked applications ── */}
          {!!customer.applications?.length && (
            <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: border, padding: 16 }}>
              <Text style={{
                fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 0.5, color: labelColor, marginBottom: 10,
              }}>
                {t('customers.detail.applications')} ({customer.applications.length})
              </Text>
              {customer.applications.map((ca) => (
                <View
                  key={ca.id}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: border,
                  }}
                >
                  <Text style={{ fontSize: 13, color: textPri, flex: 1 }}>
                    {ca.application?.name ?? ca.applicationId}
                  </Text>
                  {ca.application?.version && (
                    <View style={{
                      backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
                      borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
                    }}>
                      <Text style={{ color: '#1d4ed8', fontSize: 11 }}>{ca.application.version}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* ── Stats ── */}
          <DetailStatRow
            stats={[
              {
                value:   customer._count?.tickets ?? 0,
                label:   t('customers.columns.tickets'),
                color:   '#1d4ed8',
                bgColor: '#eff6ff',
              },
            ]}
          />
        </>
      )}
    </AdminDetailScreen>
  );
};

export default CustomerDetailScreen;
