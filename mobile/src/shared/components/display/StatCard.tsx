import React from 'react';
import { View, Text } from 'react-native';
import StatBadge from './StatBadge';

export interface StatItem {
  label: string;
  value: number;
  color: string;
}

interface Props {
  title: string;
  subtitle?: string;
  stats?: StatItem[];
  footer?: React.ReactNode;
  isDark: boolean;
}

/**
 * Generic grid card — title + optional subtitle + stat badge row + optional footer.
 * Used in grid views across admin screens (reports, customers, dashboard, etc.)
 */
const StatCard: React.FC<Props> = ({ title, subtitle, stats, footer, isDark }) => {
  const bg     = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const text   = isDark ? '#f1f5f9' : '#0f172a';
  const muted  = isDark ? '#64748b' : '#94a3b8';

  return (
    <View style={{
      backgroundColor: bg, borderRadius: 12,
      borderWidth: 1, borderColor: border,
      padding: 14, marginBottom: 10,
    }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: text, marginBottom: 2 }} numberOfLines={1}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={{ fontSize: 11, color: muted, marginBottom: stats?.length ? 10 : 0 }}>
          {subtitle}
        </Text>
      ) : null}

      {stats && stats.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {stats.map((s) => <StatBadge key={s.label} {...s} />)}
        </View>
      )}

      {footer ? (
        <View style={{ marginTop: 8 }}>{footer}</View>
      ) : null}
    </View>
  );
};

export default StatCard;
