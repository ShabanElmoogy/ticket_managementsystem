import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { Palette, SubscriptionColors, SubscriptionSurfaces } from '@/src/constants/tokens';
import type { Customer } from '@/src/services/api/types/index';
import type { ColDef } from '@/src/shared/components/data/AppDataTable';
import type { TFunction } from 'i18next';

// ── Subscription status logic ─────────────────────────────────────────────────

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'INACTIVE' | 'PAY_AS_YOU_GO';

export function getCustomerStatus(customer: Customer): SubscriptionStatus {
  const { maintenanceType, subscriptionStartDate, subscriptionEndDate } = customer;
  const now = new Date();
  if (!maintenanceType) return 'INACTIVE';
  if (maintenanceType === 'PAY_AS_YOU_GO') return 'PAY_AS_YOU_GO';
  if (maintenanceType === 'FREE_TRIAL') {
    if (!subscriptionStartDate || !subscriptionEndDate) return 'INACTIVE';
    return now >= new Date(subscriptionStartDate) && now <= new Date(subscriptionEndDate)
      ? 'TRIAL' : 'EXPIRED';
  }
  if (maintenanceType === 'MONTHLY_SUBSCRIPTION') {
    if (!subscriptionStartDate || !subscriptionEndDate) return 'INACTIVE';
    return now >= new Date(subscriptionStartDate) && now <= new Date(subscriptionEndDate)
      ? 'ACTIVE' : 'EXPIRED';
  }
  return 'INACTIVE';
}

export function isCustomerActive(customer: Customer): boolean {
  const s = getCustomerStatus(customer);
  return s === 'ACTIVE' || s === 'TRIAL';
}

// ── Status badge — uses SubscriptionColors/SubscriptionSurfaces from tokens ───

const StatusBadge: React.FC<{ status: SubscriptionStatus }> = ({ status }) => {
  const color = SubscriptionColors[status] ?? Palette.gray500;
  const bg    = SubscriptionSurfaces.light[status] ?? Palette.gray100;
  const labels: Record<SubscriptionStatus, string> = {
    ACTIVE:        'Active',
    TRIAL:         'Trial',
    EXPIRED:       'Expired',
    INACTIVE:      'Inactive',
    PAY_AS_YOU_GO: 'Pay/Go',
  };
  return (
    <View style={{
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
      backgroundColor: bg,
      borderWidth: 1, borderColor: color + '44',
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>
        {labels[status]}
      </Text>
    </View>
  );
};

// ── Column definitions ────────────────────────────────────────────────────────

export function getCustomerColumns(t: TFunction): ColDef<Customer>[] {
  return [
    { field: 'name', headerName: t('customers.columns.name'), sortable: true },

    {
      field: 'email', headerName: t('customers.columns.email'), width: 160, sortable: true,
      renderCell: (row) => (
        <Text style={{ fontSize: 11, color: Palette.slate500 }} numberOfLines={1}>
          {row.email || '—'}
        </Text>
      ),
    },

    {
      field: 'company', headerName: t('customers.detail.company'), width: 120, sortable: true,
      renderCell: (row) => (
        <Text style={{ fontSize: 12, color: Palette.gray500 }} numberOfLines={1}>
          {row.company || '—'}
        </Text>
      ),
    },

    {
      field: 'subscriptionStatus', headerName: t('customers.columns.status'), width: 120, align: 'center',
      renderCell: (row) => {
        const status = (row.subscriptionStatus as SubscriptionStatus | undefined)
          ?? getCustomerStatus(row);
        return <StatusBadge status={status} />;
      },
    },

    {
      field: 'maintenanceType', headerName: t('customers.detail.maintenanceType'), width: 130, align: 'center',
      renderCell: (row) => {
        if (!row.maintenanceType) return (
          <Text style={{ fontSize: 11, color: Palette.gray400 }}>—</Text>
        );
        const labels: Record<string, string> = {
          MONTHLY_SUBSCRIPTION: 'Monthly',
          FREE_TRIAL:           'Trial',
          PAY_AS_YOU_GO:        'Pay/Go',
        };
        return (
          <Text style={{ fontSize: 11, color: Palette.gray700, fontWeight: '600' }}>
            {labels[row.maintenanceType] ?? row.maintenanceType}
          </Text>
        );
      },
    },

    {
      field: 'subscriptionEndDate', headerName: t('customers.detail.subscriptionEnd'), width: 110, align: 'center',
      renderCell: (row) => {
        if (!row.subscriptionEndDate) return (
          <Text style={{ fontSize: 11, color: Palette.gray400 }}>—</Text>
        );
        const end      = new Date(row.subscriptionEndDate);
        const now      = new Date();
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft < 0;
        const isSoon    = daysLeft >= 0 && daysLeft <= 30;
        const color = isExpired ? Palette.red600 : isSoon ? Palette.amber600 : Palette.green600;
        return (
          <Text style={{ fontSize: 11, color, fontWeight: isExpired || isSoon ? '700' : '500' }}>
            {formatDate(row.subscriptionEndDate)}
          </Text>
        );
      },
    },

    {
      field: '_count', headerName: t('customers.columns.tickets'), width: 70, align: 'center',
      valueGetter: (row) => row._count?.tickets ?? 0,
      renderCell: (row) => {
        const count = row._count?.tickets ?? 0;
        return (
          <View style={{
            backgroundColor: Palette.blue100,
            borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
            minWidth: 28, alignItems: 'center',
          }}>
            <Text style={{ color: Palette.blue700, fontSize: 11, fontWeight: '700' }}>{count}</Text>
          </View>
        );
      },
    },
  ];
}
