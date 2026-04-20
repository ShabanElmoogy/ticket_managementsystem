import React from 'react';
import { ScrollView, View } from 'react-native';
import { Badge, STH, TD, TableRow, TableHeader, W } from '../tableUtils';
import type { SortState } from '../useSorting';
import type { CustomerActivityRow } from '../../types';

interface Props {
  rows: CustomerActivityRow[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

const ActivityTable: React.FC<Props> = ({ rows, isDark, sort, onSort }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <TableHeader isDark={isDark}>
        <STH width={W.customer} isDark={isDark} field="customerName" sort={sort} onSort={onSort}>Customer</STH>
        <STH width={W.num}      isDark={isDark} field="created7"     sort={sort} onSort={onSort}>Created 7d</STH>
        <STH width={W.num}      isDark={isDark} field="closed7"      sort={sort} onSort={onSort}>Closed 7d</STH>
        <STH width={W.num}      isDark={isDark} field="created30"    sort={sort} onSort={onSort}>Created 30d</STH>
        <STH width={W.num}      isDark={isDark} field="closed30"     sort={sort} onSort={onSort}>Closed 30d</STH>
      </TableHeader>

      {rows.map((r, i) => (
        <TableRow key={r.id} index={i} isDark={isDark}>
          <TD width={W.customer} isDark={isDark}>{r.customerName}</TD>
          <TD width={W.num}      isDark={isDark}><Badge label={r.created7}  color="#3b82f6" /></TD>
          <TD width={W.num}      isDark={isDark}><Badge label={r.closed7}   color="#10b981" /></TD>
          <TD width={W.num}      isDark={isDark}><Badge label={r.created30} color="#3b82f6" /></TD>
          <TD width={W.num}      isDark={isDark}><Badge label={r.closed30}  color="#10b981" /></TD>
        </TableRow>
      ))}
    </View>
  </ScrollView>
);

export default ActivityTable;
