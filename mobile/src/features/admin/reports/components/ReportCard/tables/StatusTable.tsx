import React, { useMemo } from 'react';
import AppDataTable, { type ColDef } from '../../../../../../shared/components/AppDataTable';
import { W } from '../../../../../../shared/components/AppTable';
import type { SortState } from '../../../../../../shared/components/AppTable';
import type { CustomerStatusRow } from '../../../types';
import {
  createBadgeColumn,
  createTotalColumn,
  createPercentColumn,
} from '../../../../../../shared/utils/tableUtils';

interface Props {
  rows: CustomerStatusRow[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

const StatusTable: React.FC<Props> = ({ rows, isDark, sort, onSort }) => {
  const columns = useMemo<ColDef<CustomerStatusRow>[]>(() => [
    { field: 'customerName', headerName: 'Customer',  width: W.customer, align: 'left' },
    createTotalColumn<CustomerStatusRow>(isDark),
    createBadgeColumn<CustomerStatusRow>('open',       'Open',     '#f59e0b'),
    createBadgeColumn<CustomerStatusRow>('inProgress', 'In Prog.', '#8b5cf6'),
    createBadgeColumn<CustomerStatusRow>('resolved',   'Resolved', '#10b981'),
    createPercentColumn<CustomerStatusRow>('openPct',     'Open %', '#f59e0b'),
    createPercentColumn<CustomerStatusRow>('resolvedPct', 'Res. %', '#10b981'),
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
