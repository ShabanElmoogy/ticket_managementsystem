import React, { useMemo } from 'react';
import { DEFAULT_PERIOD } from '@/src/features/admin/reports/types';
import type { CustomerActivityRow, ActivityPeriod } from '@/src/features/admin/reports/types';
import { AppDataTable, W, type ColDef, type SortState } from '@/src/shared/components';
import { createBadgeColumn } from '@/src/shared/utils/tableUtils';

interface Props {
  rows: CustomerActivityRow[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
  period?: ActivityPeriod;
}

const ActivityTable: React.FC<Props> = ({ rows, isDark, sort, onSort, period = DEFAULT_PERIOD }) => {
  const columns = useMemo<ColDef<CustomerActivityRow>[]>(() => [
    { field: 'customerName', headerName: 'Customer',                 width: W.customer, align: 'left' },
    createBadgeColumn<CustomerActivityRow>('created7',  `Created ${period.labelA}`, '#3b82f6'),
    createBadgeColumn<CustomerActivityRow>('closed7',   `Closed ${period.labelA}`,  '#10b981'),
    createBadgeColumn<CustomerActivityRow>('created30', `Created ${period.labelB}`, '#3b82f6'),
    createBadgeColumn<CustomerActivityRow>('closed30',  `Closed ${period.labelB}`,  '#10b981'),
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
