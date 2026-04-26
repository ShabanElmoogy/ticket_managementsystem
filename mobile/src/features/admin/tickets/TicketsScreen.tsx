import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ticketsApi, ticketsKeys } from '@/src/features/admin/tickets/api/tickets';
import { AppBadge, AppScreenHeader, AppDataTable, type ColDef } from '@/src/shared/components';
import { useAuxData } from '@/src/shared/hooks/useAuxData';
import type { Ticket } from '@/src/services/api/types';
import { useThemeColors, useIsDark } from '@/src/constants/theme';

const TicketsScreen: React.FC = () => {
  const { t }  = useTranslation();
  const c      = useThemeColors();
  const isDark = useIsDark();

  const columns: ColDef<Ticket>[] = [
    { field: 'title',    headerName: t('tickets.title'),    flex: 1,    sortable: true },
    {
      field: 'status',   headerName: t('common.status'),   width: 130, align: 'center',
      renderCell: (row) => <AppBadge label={row.status}   variant="status"   size="small" />,
    },
    {
      field: 'priority', headerName: t('common.priority'), width: 100, align: 'center',
      renderCell: (row) => <AppBadge label={row.priority} variant="priority" size="small" />,
    },
    { field: 'customer',   headerName: t('customers.title'),  width: 140, valueGetter: (r) => r.customer?.name   ?? '—' },
    { field: 'assignedTo', headerName: t('common.assignedTo'), width: 140, valueGetter: (r) => r.assignedTo?.name ?? '—' },
    { field: 'createdAt',  headerName: t('common.created'),    width: 110, valueGetter: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const { data: tickets = [], isLoading, refetch } = useAuxData<Ticket[]>(
    ticketsKeys.all,
    () => ticketsApi.getTickets({ deleted: false }),
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.surface.secondary }}>
      <AppScreenHeader
        title={t('tickets.title')}
        badge={tickets.length}
        isDark={isDark}
        onRefresh={refetch}
        refreshLabel={t('common.refresh')}
        refreshingLabel={t('common.refreshing')}
      />
      {isLoading && tickets.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={c.interactive.primary} />
        </View>
      ) : (
        <View style={{ flex: 1, margin: 12 }}>
          <AppDataTable<Ticket>
            rows={tickets}
            columns={columns}
            loading={isLoading}
            emptyMessage={t('tickets.emptyMessage')}
          />
        </View>
      )}
    </View>
  );
};

export default TicketsScreen;
