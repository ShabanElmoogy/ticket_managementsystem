/**
 * ticketColumns — ColDef[] factory for the Tickets feature.
 *
 * Returns column definitions for Grid and Compact view modes in AdminCrudScreen.
 * Feed mode uses TicketCard as the row renderer instead.
 *
 * Columns:
 *  - title (flex 1)
 *  - status badge (colored chip using StatusColors)
 *  - priority badge (colored chip using PriorityColors)
 *  - customer name (width 120)
 *  - assigned-to name (width 120)
 *  - created date (width 100)
 */
import React from 'react';
import { View, Text } from 'react-native';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { Palette, StatusColors, PriorityColors } from '@/src/constants/tokens';
import type { Ticket } from '@/src/services/api/types/ticket';
import type { ColDef } from '@/src/shared/components/data/AppDataTable';
import type { TFunction } from 'i18next';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  OPEN:              'Open',
  IN_PROGRESS:       'In Progress',
  PROGRAMMING:       'Programming',
  UNDER_DEVELOPMENT: 'Under Dev',
  CODE_REVIEW:       'Code Review',
  TESTING:           'Testing',
  RESOLVED:          'Resolved',
  CLOSED:            'Closed',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = StatusColors[status] ?? Palette.zinc500;
  const label = STATUS_LABELS[status] ?? status;
  return (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: `${color}22`,
        borderWidth: 1,
        borderColor: `${color}44`,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>
        {label}
      </Text>
    </View>
  );
};

// ── Priority badge ────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<string, string> = {
  LOW:    'Low',
  MEDIUM: 'Medium',
  HIGH:   'High',
  URGENT: 'Urgent',
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const color = PriorityColors[priority] ?? Palette.zinc500;
  const label = PRIORITY_LABELS[priority] ?? priority;
  return (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: `${color}22`,
        borderWidth: 1,
        borderColor: `${color}44`,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>
        {label}
      </Text>
    </View>
  );
};

// ── Column definitions ────────────────────────────────────────────────────────

export function getTicketColumns(t: TFunction): ColDef<Ticket>[] {
  return [
    {
      field: 'title',
      headerName: t('tickets.columns.title'),
      width: 200,
      sortable: true,
      renderCell: (row) => (
        <Text
          style={{ fontSize: 12, fontWeight: '600', color: Palette.slate700 }}
          numberOfLines={2}
        >
          {row.title || '—'}
        </Text>
      ),
    },

    {
      field: 'status',
      headerName: t('tickets.columns.status'),
      width: 110,
      align: 'center',
      renderCell: (row) => <StatusBadge status={row.status} />,
    },

    {
      field: 'priority',
      headerName: t('tickets.columns.priority'),
      width: 90,
      align: 'center',
      renderCell: (row) => <PriorityBadge priority={row.priority} />,
    },

    {
      field: 'customer',
      headerName: t('tickets.columns.customer'),
      width: 120,
      renderCell: (row) => (
        <Text
          style={{ fontSize: 11, color: Palette.slate500 }}
          numberOfLines={1}
        >
          {row.customer?.name ?? '—'}
        </Text>
      ),
    },

    {
      field: 'assignedTo',
      headerName: t('tickets.columns.assignedTo'),
      width: 120,
      renderCell: (row) => (
        <Text
          style={{ fontSize: 11, color: Palette.slate500 }}
          numberOfLines={1}
        >
          {row.assignedTo?.name ?? '—'}
        </Text>
      ),
    },

    {
      field: 'createdAt',
      headerName: t('tickets.columns.created'),
      width: 100,
      align: 'center',
      renderCell: (row) => (
        <Text style={{ fontSize: 11, color: Palette.slate400 }}>
          {formatDate(row.createdAt)}
        </Text>
      ),
    },
  ];
}
