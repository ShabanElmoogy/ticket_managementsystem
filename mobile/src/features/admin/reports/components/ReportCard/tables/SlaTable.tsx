import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { AppDataTable, type ColDef } from '../../../../../../shared/components';
import { W } from '../../../../../../shared/components';
import type { SortState } from '../../../../../../shared/components';
import type { SlaMetricsRow } from '../../../types';
import {
  createBadgeColumn,
  createTotalColumn,
  createThresholdColumn,
} from '../../../../../../shared/utils/tableUtils';

interface Props {
  rows: SlaMetricsRow[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

const SlaTable: React.FC<Props> = ({ rows, isDark, sort, onSort }) => {
  const columns = useMemo<ColDef<SlaMetricsRow>[]>(() => [
    { field: 'customerName', headerName: 'Customer', width: W.customer, align: 'left' },
    createTotalColumn<SlaMetricsRow>(isDark),
    createBadgeColumn<SlaMetricsRow>('withDeadline', 'With SLA', '#3b82f6'),
    createBadgeColumn<SlaMetricsRow>('overdue',      'Overdue',  '#ef4444'),
    createBadgeColumn<SlaMetricsRow>('resolved',     'Resolved', '#10b981'),
    createThresholdColumn<SlaMetricsRow>(
      'onTimeCount',
      'On Time',
      (r) => r.onTimeCount,
      (r) => r.resolved,
      isDark,
    ),
    {
      field: 'avgResolutionHours',
      headerName: 'Avg Hrs',
      width: 90,
      align: 'center',
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
