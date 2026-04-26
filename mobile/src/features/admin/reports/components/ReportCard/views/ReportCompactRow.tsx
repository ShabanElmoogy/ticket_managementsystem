import React from 'react';
import { View, Text } from 'react-native';
import type { ReportType } from '@/src/features/admin/reports/types';
import { CompactListRow, InitialAvatar } from '@/src/shared/components';

interface Props { row: any; isDark: boolean; }

const ReportCompactRow: React.FC<Props> = ({ row, isDark }) => {
  const type: ReportType = row._reportType;
  const name: string     = row.customerName ?? row.title ?? '—';

  const summary =
    type === 'summary'
      ? `Open: ${row.open ?? 0}  ·  In Prog: ${row.inProgress ?? 0}  ·  Resolved: ${row.resolved ?? 0}  ·  Closed: ${row.closed ?? 0}`
      : type === 'customers-status'
      ? `Open: ${row.open ?? 0} (${(row.openPct ?? 0).toFixed(1)}%)  ·  Resolved: ${(row.resolvedPct ?? 0).toFixed(1)}% done`
      : type === 'customers-activity'
      ? `Created: ${row.created7 ?? 0}  ·  Closed: ${row.closed7 ?? 0}`
      : type === 'sla'
      ? `Overdue: ${row.overdue ?? 0}  ·  On time: ${row.onTimeCount ?? 0}  ·  Total: ${row.total ?? 0}`
      : type === 'tickets'
      ? [row.status, row.priority, row.customer?.name].filter(Boolean).join('  ·  ')
      : '';

  const totalBadge = row.total != null && type !== 'tickets' ? (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#3b82f620' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6' }}>{row.total}</Text>
    </View>
  ) : undefined;

  return (
    <CompactListRow
      title={name}
      subtitle={summary}
      isDark={isDark}
      left={<InitialAvatar name={name} />}
      right={totalBadge}
    />
  );
};

export default ReportCompactRow;
