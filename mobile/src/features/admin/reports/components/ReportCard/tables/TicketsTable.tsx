import React, { useMemo } from 'react';
import { AppDataTable, type ColDef } from '../../../../../../shared/components';
import { Badge as TableBadge, W, STATUS_COLORS, PRIORITY_COLORS } from '../../../../../../shared/components';
import type { SortState } from '../../../../../../shared/components';
import type { Ticket } from '../../../../../../services/api/types';

interface Props {
  rows: Ticket[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

const TicketsTable: React.FC<Props> = ({ rows, isDark, sort, onSort }) => {
  const columns = useMemo<ColDef<Ticket>[]>(() => [
    { field: 'title',       headerName: 'Title',       width: W.title,    align: 'left' },
    {
      field: 'status', headerName: 'Status', width: W.status, align: 'center',
      renderCell: (t) => <TableBadge label={t.status}   color={STATUS_COLORS[t.status]     ?? '#64748b'} />,
    },
    {
      field: 'priority', headerName: 'Priority', width: W.priority, align: 'center',
      renderCell: (t) => <TableBadge label={t.priority} color={PRIORITY_COLORS[t.priority] ?? '#64748b'} />,
    },
    { field: 'customer',    headerName: 'Customer',    width: W.name, align: 'left', valueGetter: (t) => t.customer?.name    ?? '—' },
    { field: 'application', headerName: 'Application', width: W.name, align: 'left', valueGetter: (t) => t.application?.name ?? '—' },
    { field: 'assignedTo',  headerName: 'Assigned',    width: W.name, align: 'left', valueGetter: (t) => t.assignedTo?.name  ?? 'Unassigned' },
  ], []);

  return (
    <AppDataTable
      rows={rows}
      columns={columns}
      sortField={sort.field}
      sortDir={sort.dir}
      onSortChange={onSort}
      emptyMessage="No tickets"
    />
  );
};

export default TicketsTable;
