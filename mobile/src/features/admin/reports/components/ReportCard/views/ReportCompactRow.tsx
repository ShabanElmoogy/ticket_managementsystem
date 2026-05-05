import React from 'react';
import { View, Text } from 'react-native';
import { Palette } from '@/src/constants/tokens';
import type { ReportType } from '@/src/features/admin/reports/types';
import { CompactListRow, InitialAvatar } from '@/src/shared/components';

interface Props { row: any; }

const ReportCompactRow: React.FC<Props> = ({ row }) => {
  if (!row) return null;
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
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: Palette.blue500 + '20' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: Palette.blue500 }}>{row.total}</Text>
    </View>
  ) : undefined;

  return (
    <CompactListRow
      title={name}
      subtitle={summary}
      left={<InitialAvatar name={name} />}
      right={totalBadge}
    />
  );
};

export default ReportCompactRow;
