import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useAuxData } from '../../../shared/hooks/useAuxData';
import { ticketsApi, ticketsKeys } from './api/tickets';
import AppBadge from '../../../shared/components/AppBadge';
import AppScreenHeader from '../../../shared/components/AppScreenHeader';
import AppDataTable, { type ColDef } from '../../../shared/components/AppDataTable';
import type { Ticket } from '../../../services/api/types';
import { useUiStore } from '../../../stores/uiStore';

const COLUMNS: ColDef<Ticket>[] = [
  { field: 'title',    headerName: 'Title',    flex: 1,   sortable: true },
  {
    field: 'status',   headerName: 'Status',   width: 130, align: 'center',
    renderCell: (row) => <AppBadge label={row.status} variant="status" size="small" />,
  },
  {
    field: 'priority', headerName: 'Priority', width: 100, align: 'center',
    renderCell: (row) => <AppBadge label={row.priority} variant="priority" size="small" />,
  },
  { field: 'customer',   headerName: 'Customer',   width: 140, valueGetter: (r) => r.customer?.name ?? '—' },
  { field: 'assignedTo', headerName: 'Assigned To', width: 140, valueGetter: (r) => r.assignedTo?.name ?? 'Unassigned' },
  { field: 'createdAt',  headerName: 'Created',     width: 110, valueGetter: (r) => new Date(r.createdAt).toLocaleDateString() },
];

const TicketsScreen: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const { data: tickets = [], isLoading } = useAuxData<Ticket[]>(
    ticketsKeys.all,
    () => ticketsApi.getTickets({ deleted: false }),
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <AppScreenHeader title="Tickets" badge={tickets.length} />
      {isLoading && tickets.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
          <AppDataTable<Ticket>
            rows={tickets}
            columns={COLUMNS}
            loading={isLoading}
            emptyMessage="No tickets yet"
          />
        </ScrollView>
      )}
    </View>
  );
};

export default TicketsScreen;
