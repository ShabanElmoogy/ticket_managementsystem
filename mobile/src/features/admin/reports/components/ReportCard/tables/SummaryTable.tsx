import React, { useMemo } from 'react';
import type { CustomerTicketsSummaryRow } from '@/src/features/admin/reports/types';
import { AppDataTable, type ColDef, type SortState, W } from '@/src/shared/components';
import { createBadgeColumn, createTotalColumn } from '@/src/shared/utils/tableUtils';

interface Props {
  rows: CustomerTicketsSummaryRow[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

const SummaryTable: React.FC<Props> = ({ rows, isDark, sort, onSort }) => {
  const columns = useMemo<ColDef<CustomerTicketsSummaryRow>[]>(() => [
    { field: 'customerName', headerName: 'Customer',     width: W.customer, align: 'left' },
    createTotalColumn<CustomerTicketsSummaryRow>(isDark),
    createBadgeColumn<CustomerTicketsSummaryRow>('open',       'Open',        '#f59e0b'),
    createBadgeColumn<CustomerTicketsSummaryRow>('inProgress', 'In Progress', '#8b5cf6'),
    createBadgeColumn<CustomerTicketsSummaryRow>('resolved',   'Resolved',    '#10b981'),
    createBadgeColumn<CustomerTicketsSummaryRow>('closed',     'Closed',      '#64748b'),
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

export default SummaryTable;
