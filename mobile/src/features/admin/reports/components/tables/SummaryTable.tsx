import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Badge, TH, TD, TableRow, TableHeader, W } from '../tableUtils';
import type { CustomerTicketsSummaryRow } from '../../types';

interface Props { rows: CustomerTicketsSummaryRow[]; isDark: boolean }

const SummaryTable: React.FC<Props> = ({ rows, isDark }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <TableHeader isDark={isDark}>
        <TH width={W.customer} isDark={isDark}>Customer</TH>
        <TH width={W.num}      isDark={isDark}>Total</TH>
        <TH width={W.num}      isDark={isDark}>Open</TH>
        <TH width={W.num}      isDark={isDark}>In Progress</TH>
        <TH width={W.num}      isDark={isDark}>Resolved</TH>
        <TH width={W.num}      isDark={isDark}>Closed</TH>
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
