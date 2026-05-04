import React from 'react';
import { View, Text } from 'react-native';
import { formatDate } from '@/src/shared/utils/dateUtils';
import type { Application } from '@/src/services/api/types';
import type { ColDef } from '@/src/shared/components/data/AppDataTable';
import type { TFunction } from 'i18next';

/**
 * Returns translated column definitions.
 * Accepts `t` so columns can be translated without using hooks directly.
 */
export function getApplicationColumns(t: TFunction): ColDef<Application>[] {
  return [
    { field: 'name',    headerName: t('applications.columns.name'),    sortable: true },
    {
      field: 'version', headerName: t('applications.columns.version'), width: 90, sortable: true,
      renderCell: (row) => (
        <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: '#1d4ed8', fontSize: 11, fontFamily: 'monospace' }}>{row.version ?? '—'}</Text>
        </View>
      ),
    },
    {
      field: '_count', headerName: t('applications.columns.tickets'), width: 70, align: 'center',
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
    {
      field: '_countCustomers', headerName: t('applications.columns.customers'), width: 80, align: 'center',
      valueGetter: (row) => row._count?.customers ?? 0,
      renderCell: (row) => {
        const count = row._count?.customers ?? 0;
        return (
          <View style={{ backgroundColor: '#d1fae5', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, minWidth: 28, alignItems: 'center' }}>
            <Text style={{ color: '#065f46', fontSize: 11, fontWeight: '700' }}>{count}</Text>
          </View>
        );
      },
    },
    {
      field: 'createdAt', headerName: t('applications.columns.created'), width: 100, align: 'center',
      renderCell: (row) => (
        <Text style={{ color: '#6b7280', fontSize: 11 }}>
          {row.createdAt ? formatDate(row.createdAt) : '—'}
        </Text>
      ),
    },
  ];
}
