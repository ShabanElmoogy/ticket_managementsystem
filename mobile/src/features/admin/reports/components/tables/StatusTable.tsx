import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Badge, TH, TD, TableRow, TableHeader, W } from '../tableUtils';
import type { CustomerStatusRow } from '../../types';

interface Props { rows: CustomerStatusRow[]; isDark: boolean }

const StatusTable: React.FC<Props> = ({ rows, isDark }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <TableHeader isDark={isDark}>
        <TH width={W.customer} isDark={isDark}>Customer</TH>
        <TH width={W.num}      isDark={isDark}>Total</TH>
        <TH width={W.num}      isDark={isDark}>Open</TH>
        <TH width={W.num}      isDark={isDark}>In Prog.</TH>
        <TH width={W.num}      isDark={isDark}>Resolved</TH>
        <TH width={W.pct}      isDark={isDark}>Open %</TH>
        <TH width={W.pct}      isDark={isDark}>Res. %</TH>
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
          <TD width={W.pct} isDark={isDark}>
            <Text style={{ fontSize: 12, color: '#f59e0b', fontWeight: '600' }}>{r.openPct.toFixed(1)}%</Text>
          </TD>
          <TD width={W.pct} isDark={isDark}>
            <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '600' }}>{r.resolvedPct.toFixed(1)}%</Text>
          </TD>
        </TableRow>
      ))}
    </View>
  </ScrollView>
);

export default StatusTable;
