import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { AppBadge } from '@/src/shared/components';
import { useIsDark } from '@/src/constants/theme';
import { customersApi, customersKeys } from '../api/customers';

interface Props {
  customerId:    string;
  onClose:       () => void;
  onEdit:        () => void;
  onDelete:      () => void;
  /** Set false while delete is in progress — prevents refetch of deleted resource */
  queryEnabled?: boolean;
}

/**
 * CustomerDetailScreen — read-only detail view for a single customer.
 * Shown when a row is tapped in the table/grid/compact view.
 */
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

  // ── theme tokens ────────────────────────────────────────────────────────────
  const bg         = isDark ? '#0f172a' : '#f8fafc';
  const cardBg     = isDark ? '#1e293b' : '#ffffff';
  const border     = isDark ? '#334155' : '#e5e7eb';
  const textPri    = isDark ? '#f1f5f9' : '#111827';
  const textSec    = isDark ? '#94a3b8' : '#6b7280';
  const labelColor = isDark ? '#64748b' : '#9ca3af';

  // ── helper: info row ────────────────────────────────────────────────────────
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <Text style={{ fontSize: 12, color: labelColor, width: 90, paddingTop: 1 }}>{label}</Text>
        <Text style={{ flex: 1, fontSize: 13, color: textSec, lineHeight: 20 }}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>

      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: cardBg,
        borderBottomWidth: 1, borderBottomColor: border,
      }}>
        <Pressable
          onPress={onClose}
          style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: isDark ? '#334155' : '#f3f4f6',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: textSec, fontSize: 18 }}>←</Text>
        </Pressable>

        <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: textPri }} numberOfLines={1}>
          {customer?.name ?? t('customers.title')}
        </Text>

        <Pressable
          onPress={onEdit}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
            backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563eb' }}>✏️ {t('common.edit')}</Text>
        </Pressable>

        <Pressable
          onPress={onDelete}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
            backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>🗑️ {t('common.delete')}</Text>
        </Pressable>
      </View>

      {/* ── Body ── */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : !customer ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: textSec }}>{t('customers.notFound')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>

          {/* ── Main info card ── */}
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: border, padding: 16 }}>
            {/* Name + status badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: '800', color: textPri }} numberOfLines={2}>
                {customer.name}
              </Text>
              {customer.subscriptionStatus && (
                <AppBadge label={customer.subscriptionStatus} variant="status" size="small" />
              )}
            </View>

            <InfoRow label={t('customers.columns.email')} value={customer.email} />
            <InfoRow label={t('customers.columns.phone')} value={customer.phone} />
            <InfoRow label={t('customers.detail.company')}  value={customer.company} />
            <InfoRow label={t('customers.detail.address')}  value={customer.address} />

            {/* Created */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: labelColor, width: 90 }}>{t('customers.columns.created')}</Text>
              <Text style={{ fontSize: 13, color: textSec }}>{formatDate(customer.createdAt)}</Text>
            </View>
          </View>

          {/* ── Description ── */}
          {!!customer.description && (
            <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: border, padding: 16 }}>
              <Text style={{
                fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 0.5, color: labelColor, marginBottom: 8,
              }}>
                {t('common.description')}
              </Text>
              <Text style={{ fontSize: 14, color: textPri, lineHeight: 22 }}>{customer.description}</Text>
            </View>
          )}

          {/* ── Maintenance / subscription ── */}
          {customer.maintenanceType && (
            <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: border, padding: 16 }}>
              <Text style={{
                fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 0.5, color: labelColor, marginBottom: 10,
              }}>
                {t('customers.detail.maintenance')}
              </Text>
              <InfoRow label={t('customers.detail.maintenanceType')} value={customer.maintenanceType} />
              <InfoRow label={t('customers.detail.subscriptionStart')} value={customer.subscriptionStartDate ? formatDate(customer.subscriptionStartDate) : null} />
              <InfoRow label={t('customers.detail.subscriptionEnd')}   value={customer.subscriptionEndDate   ? formatDate(customer.subscriptionEndDate)   : null} />
            </View>
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
                    paddingVertical: 6,
                    borderBottomWidth: 1, borderBottomColor: border,
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

          {/* ── Ticket count stat ── */}
          <View style={{
            backgroundColor: '#eff6ff', borderRadius: 12,
            borderWidth: 1, borderColor: '#bfdbfe',
            padding: 16, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#1d4ed8' }}>
              {customer._count?.tickets ?? 0}
            </Text>
            <Text style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>
              {t('customers.columns.tickets')}
            </Text>
          </View>

        </ScrollView>
      )}
    </View>
  );
};

export default CustomerDetailScreen;
