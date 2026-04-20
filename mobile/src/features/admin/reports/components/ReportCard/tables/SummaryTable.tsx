import React, { useMemo } from 'react';
import AppDataTable, { type ColDef } from '../../../../../../shared/components/AppDataTable';
import { Badge as TableBadge, W } from '../../../../../../shared/components/AppTable';
import type { SortState } from '../../../../../../shared/components/AppTable';
import type { CustomerTicketsSummaryRow } from '../../../types';
import { createBadgeColumn, createTotalColumn } from '../../../../../../shared/utils/tableUtils';

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
