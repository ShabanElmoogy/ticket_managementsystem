import React, { useMemo } from 'react';
import { useThemeColors } from '@/src/constants/theme';
import type { CustomerTicketsSummaryRow } from '@/src/features/admin/reports/types';
import { AppDataTable, type ColDef, type SortState, W } from '@/src/shared/components';
import { createBadgeColumn, createTotalColumn } from '@/src/shared/utils/tableUtils';
import { Palette } from '@/src/constants/tokens';

interface Props {
  rows: CustomerTicketsSummaryRow[];
  sort: SortState;
  onSort: (field: string) => void;
}

const SummaryTable: React.FC<Props> = ({ rows, sort, onSort }) => {
  const c = useThemeColors();
  const columns = useMemo<ColDef<CustomerTicketsSummaryRow>[]>(() => [
    { field: 'customerName', headerName: 'Customer',     width: W.customer, align: 'left' },
    createTotalColumn<CustomerTicketsSummaryRow>(c),
    createBadgeColumn<CustomerTicketsSummaryRow>('open',       'Open',        Palette.amber500),
    createBadgeColumn<CustomerTicketsSummaryRow>('inProgress', 'In Progress', Palette.violet500),
    createBadgeColumn<CustomerTicketsSummaryRow>('resolved',   'Resolved',    Palette.emerald500),
    createBadgeColumn<CustomerTicketsSummaryRow>('closed',     'Closed',      Palette.zinc500),
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

export default SummaryTable;
