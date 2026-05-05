import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import type { SlaMetricsRow } from '@/src/features/admin/reports/types';
import { AppDataTable, W, type ColDef, type SortState } from '@/src/shared/components';
import { Palette } from '@/src/constants/tokens';
import {
  createBadgeColumn,
  createTotalColumn,
  createThresholdColumn,
} from '@/src/shared/utils/tableUtils';

interface Props {
  rows: SlaMetricsRow[];
  sort: SortState;
  onSort: (field: string) => void;
}

const SlaTable: React.FC<Props> = ({ rows, sort, onSort }) => {
  const c = useThemeColors();
  const columns = useMemo<ColDef<SlaMetricsRow>[]>(() => [
    { field: 'customerName', headerName: 'Customer', width: W.customer, align: 'left' },
    createTotalColumn<SlaMetricsRow>(c),
    createBadgeColumn<SlaMetricsRow>('withDeadline', 'With SLA', Palette.blue500),
    createBadgeColumn<SlaMetricsRow>('overdue',      'Overdue',  Palette.red500),
    createBadgeColumn<SlaMetricsRow>('resolved',     'Resolved', Palette.emerald500),
    createThresholdColumn<SlaMetricsRow>(
      'onTimeCount',
      'On Time',
      (r) => r.onTimeCount,
      (r) => r.resolved,
      c,
    ),
    {
      field: 'avgResolutionHours',
      headerName: 'Avg Hrs',
      width: 90,
      align: 'center',
      renderCell: (r) => r.avgResolutionHours !== null
        ? <Text style={{ fontSize: 12, fontWeight: '600', color: c.text.primary }}>{r.avgResolutionHours}h</Text>
        : <Text style={{ fontSize: 12, color: c.text.muted }}>—</Text>,
    },
  ], [c]);

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
