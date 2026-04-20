import React, { useMemo } from 'react';
import { Text } from 'react-native';
import AppDataTable, { type ColDef } from '../../../../../shared/components/AppDataTable';
import { Badge as TableBadge, W } from '../../../../../shared/components/AppTable';
import type { SortState } from '../../../../../shared/components/AppTable';
import type { CustomerStatusRow } from '../../types';

interface Props {
  rows: CustomerStatusRow[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

const StatusTable: React.FC<Props> = ({ rows, isDark, sort, onSort }) => {
  const columns = useMemo<ColDef<CustomerStatusRow>[]>(() => [
    { field: 'customerName', headerName: 'Customer',   width: W.customer, align: 'left' },
    {
      field: 'total', headerName: 'Total', width: W.num, align: 'center',
      renderCell: (r) => (
        <Text style={{ fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 13 }}>{r.total}</Text>
      ),
    },
    { field: 'open',       headerName: 'Open',     width: W.num, align: 'center', renderCell: (r) => <TableBadge label={r.open}       color="#f59e0b" /> },
    { field: 'inProgress', headerName: 'In Prog.', width: W.num, align: 'center', renderCell: (r) => <TableBadge label={r.inProgress} color="#8b5cf6" /> },
    { field: 'resolved',   headerName: 'Resolved', width: W.num, align: 'center', renderCell: (r) => <TableBadge label={r.resolved}   color="#10b981" /> },
    {
      field: 'openPct', headerName: 'Open %', width: W.pct, align: 'center',
      renderCell: (r) => <Text style={{ fontSize: 12, color: '#f59e0b', fontWeight: '600' }}>{r.openPct.toFixed(1)}%</Text>,
    },
    {
      field: 'resolvedPct', headerName: 'Res. %', width: W.pct, align: 'center',
      renderCell: (r) => <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '600' }}>{r.resolvedPct.toFixed(1)}%</Text>,
    },
  ], [isDark]);

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
