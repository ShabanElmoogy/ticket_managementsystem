import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Badge, STH, TD, TableRow, TableHeader, W } from '../tableUtils';
import type { SortState } from '../useSorting';
import type { CustomerTicketsSummaryRow } from '../../types';

interface Props {
  rows: CustomerTicketsSummaryRow[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

const SummaryTable: React.FC<Props> = ({ rows, isDark, sort, onSort }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <TableHeader isDark={isDark}>
        <STH width={W.customer} isDark={isDark} field="customerName" sort={sort} onSort={onSort}>Customer</STH>
        <STH width={W.num}      isDark={isDark} field="total"        sort={sort} onSort={onSort}>Total</STH>
        <STH width={W.num}      isDark={isDark} field="open"         sort={sort} onSort={onSort}>Open</STH>
        <STH width={W.num}      isDark={isDark} field="inProgress"   sort={sort} onSort={onSort}>In Progress</STH>
        <STH width={W.num}      isDark={isDark} field="resolved"     sort={sort} onSort={onSort}>Resolved</STH>
        <STH width={W.num}      isDark={isDark} field="closed"       sort={sort} onSort={onSort}>Closed</STH>
      </TableHeader>

      {rows.map((r, i) => (
        <TableRow key={r.id} index={i} isDark={isDark}>
          <TD width={W.customer} isDark={isDark}>{r.customerName}</TD>
          <TD width={W.num}      isDark={isDark}>
            <Text style={{ fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 13 }}>{r.total}</Text>
          </TD>
          <TD width={W.num} isDark={isDark}><Badge label={r.open}       color="#f59e0b" /></TD>
          <TD width={W.num} isDark={isDark}><Badge label={r.inProgress} color="#8b5cf6" /></TD>
          <TD width={W.num} isDark={isDark}><Badge label={r.resolved}   color="#10b981" /></TD>
          <TD width={W.num} isDark={isDark}><Badge label={r.closed}     color="#64748b" /></TD>
        </TableRow>
      ))}
    </View>
  </ScrollView>
);

export default SummaryTable;
