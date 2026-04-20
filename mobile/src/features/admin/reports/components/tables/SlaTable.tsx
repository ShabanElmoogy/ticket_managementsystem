import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import AppDataTable, { type ColDef } from '../../../../../shared/components/AppDataTable';
import { Badge as TableBadge, W } from '../../../../../shared/components/AppTable';
import type { SortState } from '../../../../../shared/components/AppTable';
import type { SlaMetricsRow } from '../../types';

interface Props {
  rows: SlaMetricsRow[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

const SlaTable: React.FC<Props> = ({ rows, isDark, sort, onSort }) => {
  const columns = useMemo<ColDef<SlaMetricsRow>[]>(() => [
    { field: 'customerName',       headerName: 'Customer', width: W.customer, align: 'left' },
    {
      field: 'total', headerName: 'Total', width: W.num, align: 'center',
      renderCell: (r) => (
        <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#e2e8f0' : '#1e293b' }}>{r.total}</Text>
      ),
    },
    { field: 'withDeadline', headerName: 'With SLA', width: W.num, align: 'center', renderCell: (r) => <TableBadge label={r.withDeadline} color="#3b82f6" /> },
    {
      field: 'overdue', headerName: 'Overdue', width: W.num, align: 'center',
      renderCell: (r) => <TableBadge label={r.overdue} color={r.overdue > 0 ? '#ef4444' : '#10b981'} />,
    },
    { field: 'resolved', headerName: 'Resolved', width: W.num, align: 'center', renderCell: (r) => <TableBadge label={r.resolved} color="#10b981" /> },
    {
      field: 'onTimeCount', headerName: 'On Time', width: 80, align: 'center',
      renderCell: (r) => {
        const pct = r.resolved > 0 ? Math.round((r.onTimeCount / r.resolved) * 100) : null;
        if (pct === null) return <Text style={{ fontSize: 12, color: isDark ? '#475569' : '#94a3b8' }}>—</Text>;
        return (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
              {r.onTimeCount}
            </Text>
            <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' }}>{pct}%</Text>
          </View>
        );
      },
    },
    {
      field: 'avgResolutionHours', headerName: 'Avg Hrs', width: 90, align: 'center',
      renderCell: (r) => r.avgResolutionHours !== null
        ? <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#e2e8f0' : '#1e293b' }}>{r.avgResolutionHours}h</Text>
        : <Text style={{ fontSize: 12, color: isDark ? '#475569' : '#94a3b8' }}>—</Text>,
    },
  ], [isDark]);

  return (
    <AppDataTable
      rows={rows}
      columns={columns}
      sortField={sort.field}
      sortDir={sort.dir}
      onSortChange={onSort}
      emptyMessage="No SLA data"
    />
  );
};

export default SlaTable;
