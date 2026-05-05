import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import { Palette } from '@/src/constants/tokens';
import type { ReportType } from '@/src/features/admin/reports/types';
import { StatCard, type StatItem } from '@/src/shared/components';

interface Props { row: any; }

const ReportGridCard: React.FC<Props> = ({ row }) => {
  const c = useThemeColors();
  if (!row) return null;
  const name: string     = row.customerName ?? row.title ?? '—';
  const type: ReportType = row._reportType;

  // ── Build stat badges ────────────────────────────────────────────────────
  const stats: StatItem[] = [];

  if (type === 'summary') {
    if (row.open       != null) stats.push({ label: 'Open',     value: row.open,                    color: Palette.amber500  });
    if (row.inProgress != null) stats.push({ label: 'In Prog',  value: row.inProgress,              color: Palette.violet500 });
    if (row.resolved   != null) stats.push({ label: 'Resolved', value: row.resolved,                color: Palette.emerald500 });
    if (row.closed     != null) stats.push({ label: 'Closed',   value: row.closed,                  color: Palette.zinc500   });
  } else if (type === 'customers-status') {
    if (row.open       != null) stats.push({ label: 'Open',     value: row.open,                    color: Palette.amber500  });
    if (row.inProgress != null) stats.push({ label: 'In Prog',  value: row.inProgress,              color: Palette.violet500 });
    if (row.resolved   != null) stats.push({ label: 'Resolved', value: row.resolved,                color: Palette.emerald500 });
    if (row.openPct    != null) stats.push({ label: 'Open %',   value: Math.round(row.openPct),     color: Palette.amber500  });
    if (row.resolvedPct != null) stats.push({ label: 'Res. %',  value: Math.round(row.resolvedPct), color: Palette.emerald500 });
  } else if (type === 'customers-activity') {
    if (row.created7   != null) stats.push({ label: 'Created',  value: row.created7,  color: Palette.blue500   });
    if (row.closed7    != null) stats.push({ label: 'Closed',   value: row.closed7,   color: Palette.emerald500 });
    if (row.created30  != null) stats.push({ label: 'Cr 30d',   value: row.created30, color: Palette.indigo500 });
    if (row.closed30   != null) stats.push({ label: 'Cl 30d',   value: row.closed30,  color: Palette.pink500   });
  } else if (type === 'sla') {
    if (row.total      != null) stats.push({ label: 'Total',    value: row.total,       color: Palette.blue500    });
    if (row.overdue    != null) stats.push({ label: 'Overdue',  value: row.overdue,     color: Palette.red500     });
    if (row.onTimeCount != null) stats.push({ label: 'On Time', value: row.onTimeCount, color: Palette.emerald500 });
  }

  // ── Build subtitle ───────────────────────────────────────────────────────
  const subtitle = row.total != null && type !== 'tickets'
    ? `${row.total} total tickets`
    : undefined;

  // ── Build footer ─────────────────────────────────────────────────────────
  const footer =
    type === 'sla' && row.avgResolutionHours != null ? (
      <Text style={{ fontSize: 11, color: c.text.muted }}>
        Avg resolution: {row.avgResolutionHours.toFixed(1)}h
      </Text>
    ) : type === 'tickets' ? (
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {row.status && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Palette.blue500 + '20' }}>
            <Text style={{ fontSize: 11, color: Palette.blue500, fontWeight: '600' }}>{row.status}</Text>
          </View>
        )}
        {row.priority && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Palette.amber500 + '20' }}>
            <Text style={{ fontSize: 11, color: Palette.amber500, fontWeight: '600' }}>{row.priority}</Text>
          </View>
        )}
        {row.customer?.name && (
          <Text style={{ fontSize: 11, color: c.text.muted }}>{row.customer.name}</Text>
        )}
      </View>
    ) : undefined;

  return (
    <StatCard
      title={name}
      subtitle={subtitle}
      stats={stats}
      footer={footer}
    />
  );
};

export default ReportGridCard;
