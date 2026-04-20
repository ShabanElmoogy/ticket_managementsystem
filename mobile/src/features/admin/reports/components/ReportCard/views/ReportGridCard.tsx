import React from 'react';
import { View, Text } from 'react-native';
import type { ReportType } from '../../../types';
import StatCard, { type StatItem } from '../../../../../../shared/components/StatCard';

interface Props { row: any; isDark: boolean; }

const ReportGridCard: React.FC<Props> = ({ row, isDark }) => {
  const name: string     = row.customerName ?? row.title ?? '—';
  const type: ReportType = row._reportType;
  const muted            = isDark ? '#64748b' : '#94a3b8';

  // ── Build stat badges ────────────────────────────────────────────────────
  const stats: StatItem[] = [];

  if (type === 'summary' || type === 'customers-status') {
    if (row.open       != null) stats.push({ label: 'Open',     value: row.open,        color: '#f59e0b' });
    if (row.inProgress != null) stats.push({ label: 'In Prog',  value: row.inProgress,  color: '#8b5cf6' });
    if (row.resolved   != null) stats.push({ label: 'Resolved', value: row.resolved,    color: '#10b981' });
    if (row.closed     != null) stats.push({ label: 'Closed',   value: row.closed,      color: '#64748b' });
  } else if (type === 'customers-activity') {
    if (row.created7   != null) stats.push({ label: 'Created',  value: row.created7,    color: '#3b82f6' });
    if (row.closed7    != null) stats.push({ label: 'Closed',   value: row.closed7,     color: '#10b981' });
    if (row.created30  != null) stats.push({ label: 'Cr 30d',   value: row.created30,   color: '#6366f1' });
    if (row.closed30   != null) stats.push({ label: 'Cl 30d',   value: row.closed30,    color: '#ec4899' });
  } else if (type === 'sla') {
    if (row.total      != null) stats.push({ label: 'Total',    value: row.total,       color: '#3b82f6' });
    if (row.overdue    != null) stats.push({ label: 'Overdue',  value: row.overdue,     color: '#ef4444' });
    if (row.onTimeCount != null) stats.push({ label: 'On Time', value: row.onTimeCount, color: '#10b981' });
  }

  // ── Build subtitle ───────────────────────────────────────────────────────
  const subtitle = row.total != null && type !== 'tickets'
    ? `${row.total} total tickets`
    : undefined;

  // ── Build footer ─────────────────────────────────────────────────────────
  const footer =
    type === 'sla' && row.avgResolutionHours != null ? (
      <Text style={{ fontSize: 11, color: muted }}>
        Avg resolution: {row.avgResolutionHours.toFixed(1)}h
      </Text>
    ) : type === 'tickets' ? (
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {row.status && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#3b82f620' }}>
            <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '600' }}>{row.status}</Text>
          </View>
        )}
        {row.priority && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#f59e0b20' }}>
            <Text style={{ fontSize: 11, color: '#f59e0b', fontWeight: '600' }}>{row.priority}</Text>
          </View>
        )}
        {row.customer?.name && (
          <Text style={{ fontSize: 11, color: muted }}>{row.customer.name}</Text>
        )}
      </View>
    ) : undefined;

  return (
    <StatCard
      title={name}
      subtitle={subtitle}
      stats={stats}
      footer={footer}
      isDark={isDark}
    />
  );
};

export default ReportGridCard;
