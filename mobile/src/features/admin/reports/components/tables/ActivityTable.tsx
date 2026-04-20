import React, { useMemo } from 'react';
import AppDataTable, { type ColDef } from '../../../../../shared/components/AppDataTable';
import { Badge as TableBadge, W } from '../../../../../shared/components/AppTable';
import type { SortState } from '../../../../../shared/components/AppTable';
import type { CustomerActivityRow, ActivityPeriod } from '../../types';
import { DEFAULT_PERIOD } from '../../types';

interface Props {
  rows: CustomerActivityRow[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
  period?: ActivityPeriod;
}

const ActivityTable: React.FC<Props> = ({ rows, isDark, sort, onSort, period = DEFAULT_PERIOD }) => {
  const columns = useMemo<ColDef<CustomerActivityRow>[]>(() => [
    { field: 'customerName', headerName: 'Customer',                  width: W.customer, align: 'left' },
    { field: 'created7',     headerName: `Created ${period.labelA}`,  width: W.num, align: 'center', renderCell: (r) => <TableBadge label={r.created7}  color="#3b82f6" /> },
    { field: 'closed7',      headerName: `Closed ${period.labelA}`,   width: W.num, align: 'center', renderCell: (r) => <TableBadge label={r.closed7}   color="#10b981" /> },
    { field: 'created30',    headerName: `Created ${period.labelB}`,  width: W.num, align: 'center', renderCell: (r) => <TableBadge label={r.created30} color="#3b82f6" /> },
    { field: 'closed30',     headerName: `Closed ${period.labelB}`,   width: W.num, align: 'center', renderCell: (r) => <TableBadge label={r.closed30}  color="#10b981" /> },
  ], [period]);

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

export default ActivityTable;
