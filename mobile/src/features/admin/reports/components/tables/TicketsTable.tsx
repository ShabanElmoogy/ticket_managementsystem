import React from 'react';
import { ScrollView, View } from 'react-native';
import { Badge, STH, TD, TableRow, TableHeader, W, STATUS_COLORS, PRIORITY_COLORS } from '../tableUtils';
import type { SortState } from '../useSorting';
import type { Ticket } from '../../../../../services/api/types';

interface Props {
  rows: Ticket[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

const TicketsTable: React.FC<Props> = ({ rows, isDark, sort, onSort }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <TableHeader isDark={isDark}>
        <STH width={W.title}    isDark={isDark} field="title"    sort={sort} onSort={onSort}>Title</STH>
        <STH width={W.status}   isDark={isDark} field="status"   sort={sort} onSort={onSort}>Status</STH>
        <STH width={W.priority} isDark={isDark} field="priority" sort={sort} onSort={onSort}>Priority</STH>
        <STH width={W.name}     isDark={isDark} field="customer" sort={sort} onSort={onSort}>Customer</STH>
        <STH width={W.name}     isDark={isDark} field="application" sort={sort} onSort={onSort}>Application</STH>
        <STH width={W.name}     isDark={isDark} field="assignedTo" sort={sort} onSort={onSort}>Assigned</STH>
      </TableHeader>

      {rows.map((t, i) => (
        <TableRow key={t.id} index={i} isDark={isDark}>
          <TD width={W.title}    isDark={isDark}>{t.title}</TD>
          <TD width={W.status}   isDark={isDark}>
            <Badge label={t.status}   color={STATUS_COLORS[t.status]     ?? '#64748b'} />
          </TD>
          <TD width={W.priority} isDark={isDark}>
            <Badge label={t.priority} color={PRIORITY_COLORS[t.priority] ?? '#64748b'} />
          </TD>
          <TD width={W.name} isDark={isDark}>{t.customer?.name     ?? '—'}</TD>
          <TD width={W.name} isDark={isDark}>{t.application?.name  ?? '—'}</TD>
          <TD width={W.name} isDark={isDark}>{t.assignedTo?.name   ?? 'Unassigned'}</TD>
        </TableRow>
      ))}
    </View>
  </ScrollView>
);

export default TicketsTable;
