import React from 'react';
import { View, Text } from 'react-native';
import { formatDate } from '@/src/shared/utils/dateUtils';
import type { Customer } from '@/src/services/api/types';
import type { ColDef } from '@/src/shared/components/data/AppDataTable';
import type { TFunction } from 'i18next';

// ── Subscription status logic (mirrors api/src/modules/customers/customers.controller.js) ──

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

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SubscriptionStatus, { color: string; bg: string; label: string }> = {
  ACTIVE:          { color: '#16a34a', bg: '#f0fdf4', label: 'Active'       },
  TRIAL:           { color: '#7c3aed', bg: '#f5f3ff', label: 'Trial'        },
  EXPIRED:         { color: '#dc2626', bg: '#fef2f2', label: 'Expired'      },
  INACTIVE:        { color: '#6b7280', bg: '#f9fafb', label: 'Inactive'     },
  PAY_AS_YOU_GO:   { color: '#0284c7', bg: '#f0f9ff', label: 'Pay As You Go'},
};

const StatusBadge: React.FC<{ status: SubscriptionStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={{
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
      backgroundColor: cfg.bg,
      borderWidth: 1, borderColor: cfg.color + '44',
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color }}>
        {cfg.label}
      </Text>
    </View>
  );
};

// ── Column definitions ────────────────────────────────────────────────────────

export function getCustomerColumns(t: TFunction): ColDef<Customer>[] {
  return [
    // Name — primary identifier
    {
      field: 'name', headerName: t('customers.columns.name'), flex: 1, sortable: true,
    },

    // Company — shown when available
    {
      field: 'company', headerName: t('customers.detail.company'), width: 130, sortable: true,
      renderCell: (row) => (
        <Text style={{ fontSize: 12, color: '#6b7280' }} numberOfLines={1}>
          {row.company || '—'}
        </Text>
      ),
    },

    // Subscription status — computed from maintenanceType + dates
    {
      field: 'subscriptionStatus', headerName: t('customers.columns.status'), width: 120, align: 'center',
      renderCell: (row) => {
        // Use server-provided status if available, otherwise compute client-side
        const status = (row.subscriptionStatus as SubscriptionStatus | undefined)
          ?? getCustomerStatus(row);
        return <StatusBadge status={status} />;
      },
    },

    // Maintenance type — shows the contract type
    {
      field: 'maintenanceType', headerName: t('customers.detail.maintenanceType'), width: 130, align: 'center',
      renderCell: (row) => {
        if (!row.maintenanceType) return (
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>—</Text>
        );
        const labels: Record<string, string> = {
          MONTHLY_SUBSCRIPTION: 'Monthly',
          FREE_TRIAL:           'Trial',
          PAY_AS_YOU_GO:        'Pay/Go',
        };
        return (
          <Text style={{ fontSize: 11, color: '#374151', fontWeight: '600' }}>
            {labels[row.maintenanceType] ?? row.maintenanceType}
          </Text>
        );
      },
    },

    // Subscription end date — most important date for active customers
    {
      field: 'subscriptionEndDate', headerName: t('customers.detail.subscriptionEnd'), width: 110, align: 'center',
      renderCell: (row) => {
        if (!row.subscriptionEndDate) return (
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>—</Text>
        );
        const end      = new Date(row.subscriptionEndDate);
        const now      = new Date();
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft < 0;
        const isSoon    = daysLeft >= 0 && daysLeft <= 30;  // expires within 30 days

        const color = isExpired ? '#dc2626' : isSoon ? '#d97706' : '#16a34a';
        return (
          <Text style={{ fontSize: 11, color, fontWeight: isExpired || isSoon ? '700' : '500' }}>
            {formatDate(row.subscriptionEndDate)}
          </Text>
        );
      },
    },

    // Ticket count
    {
      field: '_count', headerName: t('customers.columns.tickets'), width: 70, align: 'center',
      valueGetter: (row) => row._count?.tickets ?? 0,
      renderCell: (row) => {
        const count = row._count?.tickets ?? 0;
        return (
          <View style={{ backgroundColor: '#dbeafe', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, minWidth: 28, alignItems: 'center' }}>
            <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: '700' }}>{count}</Text>
          </View>
        );
      },
    },
  ];
}
