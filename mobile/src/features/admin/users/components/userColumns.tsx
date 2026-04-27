import React from 'react';
import { View, Text } from 'react-native';
import type { User } from '@/src/services/api/types';
import type { ColDef } from '@/src/shared/components/data/AppDataTable';
import type { TFunction } from 'i18next';

// ── Role badge config ─────────────────────────────────────────────────────────

export const ROLE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  SUPER_ADMIN:  { color: '#dc2626', bg: '#fef2f2', label: 'Super Admin'  },
  TENANT_ADMIN: { color: '#d97706', bg: '#fffbeb', label: 'Admin'        },
  EMPLOYEE:     { color: '#16a34a', bg: '#f0fdf4', label: 'Employee'     },
  PROGRAMMER:   { color: '#7c3aed', bg: '#f5f3ff', label: 'Programmer'   },
};

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const cfg = ROLE_CONFIG[role] ?? { color: '#6b7280', bg: '#f9fafb', label: role };
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

export function getUserColumns(t: TFunction): ColDef<User>[] {
  return [
    {
      field: 'name', headerName: t('users.columns.name'), flex: 1, sortable: true,
    },
    {
      field: 'email', headerName: t('users.columns.email'), width: 170, sortable: true,
      renderCell: (row) => (
        <Text style={{ fontSize: 11, color: '#475569' }} numberOfLines={1}>
          {row.email}
        </Text>
      ),
    },
    {
      field: 'role', headerName: t('users.columns.role'), width: 110, align: 'center',
      renderCell: (row) => <RoleBadge role={row.role} />,
    },
    {
      field: 'phone', headerName: t('users.columns.phone'), width: 120, sortable: false,
      renderCell: (row) => (
        <Text style={{ fontSize: 11, color: '#6b7280' }} numberOfLines={1}>
          {row.phone || '—'}
        </Text>
      ),
    },
    {
      field: '_count', headerName: t('users.columns.tickets'), width: 70, align: 'center',
      valueGetter: (row) => row._count?.assignedTickets ?? 0,
      renderCell: (row) => {
        const count = row._count?.assignedTickets ?? 0;
        return (
          <View style={{ backgroundColor: '#dbeafe', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, minWidth: 28, alignItems: 'center' }}>
            <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: '700' }}>{count}</Text>
          </View>
        );
      },
    },
  ];
}
