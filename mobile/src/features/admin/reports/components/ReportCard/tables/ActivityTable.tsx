import React, { useMemo } from 'react';
import { DEFAULT_PERIOD } from '@/src/features/admin/reports/types';
import type { CustomerActivityRow, ActivityPeriod } from '@/src/features/admin/reports/types';
import { AppDataTable, W, type ColDef, type SortState } from '@/src/shared/components';
import { createBadgeColumn } from '@/src/shared/utils/tableUtils';
import { Palette } from '@/src/constants/tokens';

interface Props {
  rows: CustomerActivityRow[];
  sort: SortState;
  onSort: (field: string) => void;
  period?: ActivityPeriod;
}

const ActivityTable: React.FC<Props> = ({ rows, sort, onSort, period = DEFAULT_PERIOD }) => {
  const columns = useMemo<ColDef<CustomerActivityRow>[]>(() => [
    { field: 'customerName', headerName: 'Customer',                 width: W.customer, align: 'left' },
    createBadgeColumn<CustomerActivityRow>('created7',  `Created ${period.labelA}`, Palette.blue500),
    createBadgeColumn<CustomerActivityRow>('closed7',   `Closed ${period.labelA}`,  Palette.emerald500),
    createBadgeColumn<CustomerActivityRow>('created30', `Created ${period.labelB}`, Palette.indigo500),
    createBadgeColumn<CustomerActivityRow>('closed30',  `Closed ${period.labelB}`,  Palette.pink500),
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
