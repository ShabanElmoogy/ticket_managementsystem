import React from 'react';
import { ScrollView, View } from 'react-native';
import { Badge, TH, TD, TableRow, TableHeader, W, STATUS_COLORS, PRIORITY_COLORS } from '../tableUtils';
import type { Ticket } from '../../../../../services/api/types';


interface Props { rows: Ticket[]; isDark: boolean }

const TicketsTable: React.FC<Props> = ({ rows, isDark }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <TableHeader isDark={isDark}>
        <TH width={W.title}    isDark={isDark}>Title</TH>
        <TH width={W.status}   isDark={isDark}>Status</TH>
        <TH width={W.priority} isDark={isDark}>Priority</TH>
        <TH width={W.name}     isDark={isDark}>Customer</TH>
        <TH width={W.name}     isDark={isDark}>Application</TH>
        <TH width={W.name}     isDark={isDark}>Assigned</TH>
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
