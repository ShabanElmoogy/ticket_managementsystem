import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import { Palette } from '@/src/constants/tokens';
import type { CustomerStatusRow } from '@/src/features/admin/reports/types';
import { AppDataTable, W, type ColDef, type SortState } from '@/src/shared/components';
import { createTotalColumn } from '@/src/shared/utils/tableUtils';

interface Props {
  rows: CustomerStatusRow[];
  sort: SortState;
  onSort: (field: string) => void;
}

function CountPctCell({ count, pct, color }: { count: number; pct: number; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color }}>{count}</Text>
      <Text style={{ fontSize: 10, color, opacity: 0.75 }}>{pct.toFixed(1)}%</Text>
    </View>
  );
}

const StatusTable: React.FC<Props> = ({ rows, sort, onSort }) => {
  const c = useThemeColors();
  const columns = useMemo<ColDef<CustomerStatusRow>[]>(() => [
    { field: 'customerName', headerName: 'Customer',  width: W.customer, align: 'left' },
    createTotalColumn<CustomerStatusRow>(c),
    {
      field: 'open',
      headerName: 'Open / %',
      width: 80,
      align: 'center',
      renderCell: (r) => <CountPctCell count={r.open} pct={r.openPct} color={Palette.amber500} />,
    },
    {
      field: 'inProgress',
      headerName: 'In Prog.',
      width: W.num,
      align: 'center',
      renderCell: (r) => (
        <Text style={{ fontSize: 13, fontWeight: '600', color: Palette.violet500 }}>{r.inProgress}</Text>
      ),
    },
    {
      field: 'resolved',
      headerName: 'Res+Closed / %',
      width: 100,
      align: 'center',
      renderCell: (r) => (
        <CountPctCell count={r.resolved + r.closed} pct={r.resolvedPct} color={Palette.emerald500} />
      ),
    },
  ], [c]);

  return (
    <AppDataTable
      rows={rows}
      columns={columns}
      sortField={sort.field}
      sortDir={sort.dir}
      onSortChange={onSort}
      emptyMessage="No data"
    />
  );
};

export default StatusTable;
