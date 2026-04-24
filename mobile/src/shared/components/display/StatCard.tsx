import React from 'react';
import { View, Text } from 'react-native';
import StatBadge from './StatBadge';
import { useThemeColors, FontSize, FontWeight, Radius } from '../../../constants/theme';

export interface StatItem {
  label: string;
  value: number;
  color: string;
}

interface Props {
  title:     string;
  subtitle?: string;
  stats?:    StatItem[];
  footer?:   React.ReactNode;
  isDark?:   boolean;
}

const StatCard: React.FC<Props> = ({ title, subtitle, stats, footer }) => {
  const c = useThemeColors();
  return (
    <View style={{
      backgroundColor: c.surface.primary, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border.primary,
      padding: 14, marginBottom: 10,
    }}>
      <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.text.primary, marginBottom: 2 }} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: FontSize.xs, color: c.text.muted, marginBottom: stats?.length ? 10 : 0 }}>
          {subtitle}
        </Text>
      ) : null}
      {stats && stats.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {stats.map((s) => <StatBadge key={s.label} {...s} />)}
        </View>
      )}
      {footer ? <View style={{ marginTop: 8 }}>{footer}</View> : null}
    </View>
  );
};

export default StatCard;
