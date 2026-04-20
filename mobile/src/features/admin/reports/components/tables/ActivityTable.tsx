import React from 'react';
import { ScrollView, View } from 'react-native';
import { Badge, TH, TD, TableRow, TableHeader, W } from '../tableUtils';
import type { CustomerActivityRow } from '../../types';

interface Props { rows: CustomerActivityRow[]; isDark: boolean }

const ActivityTable: React.FC<Props> = ({ rows, isDark }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <TableHeader isDark={isDark}>
        <TH width={W.customer} isDark={isDark}>Customer</TH>
        <TH width={W.num}      isDark={isDark}>Created 7d</TH>
        <TH width={W.num}      isDark={isDark}>Closed 7d</TH>
        <TH width={W.num}      isDark={isDark}>Created 30d</TH>
        <TH width={W.num}      isDark={isDark}>Closed 30d</TH>
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
