import React, { useMemo } from 'react';
import { AppDataTable, type ColDef, type SortState } from '@/src/shared/components';
import { Badge as TableBadge, W, STATUS_COLORS, PRIORITY_COLORS } from '@/src/shared/utils/tableUtils';
import { StatusColors, PriorityColors } from '@/src/constants/tokens';
import type { Ticket } from '@/src/services/api/types';

// Fallback directly to tokens in case re-export is undefined at init time
const S_COLORS = STATUS_COLORS   ?? StatusColors;
const P_COLORS = PRIORITY_COLORS ?? PriorityColors;

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
      renderCell: (t) => t?.status
        ? <TableBadge label={t.status}   color={S_COLORS[t.status]   ?? '#64748b'} />
        : null,
    },
    {
      field: 'priority', headerName: 'Priority', width: W.priority, align: 'center',
      renderCell: (t) => t?.priority
        ? <TableBadge label={t.priority} color={P_COLORS[t.priority] ?? '#64748b'} />
        : null,
    },
    { field: 'customer',    headerName: 'Customer',    width: W.name, align: 'left', valueGetter: (t) => t?.customer?.name    ?? '—' },
    { field: 'application', headerName: 'Application', width: W.name, align: 'left', valueGetter: (t) => t?.application?.name ?? '—' },
    { field: 'assignedTo',  headerName: 'Assigned',    width: W.name, align: 'left', valueGetter: (t) => t?.assignedTo?.name  ?? 'Unassigned' },
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
