import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface AdminOverviewCardProps {
  title:        string;
  icon:         string;
  total:        number;
  active:       number;
  activeLabel?: string;
  metricLabel?: string;
}

const AdminOverviewCard: React.FC<AdminOverviewCardProps> = ({
  title, icon, total, active,
  activeLabel = 'Active', metricLabel = 'Active Rate',
}) => {
  const c    = useThemeColors();
  const rate = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <View style={{
      borderRadius: Radius.lg, padding: 16, marginBottom: 12,
      backgroundColor: c.surface.primary,
      shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: FontSize['2xl'] }}>{icon}</Text>
          <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.text.primary }}>{title}</Text>
        </View>
        <View style={{ backgroundColor: c.intent.infoSurface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.interactive.primary }}>
            {rate}% {metricLabel}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: c.text.primary }}>{total.toLocaleString()}</Text>
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, marginTop: 2 }}>Total</Text>
        </View>
        <View>
          <Text style={{ fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: c.intent.success }}>{active.toLocaleString()}</Text>
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, marginTop: 2 }}>{activeLabel}</Text>
        </View>
        <View>
          <Text style={{ fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: c.interactive.primary }}>{rate}%</Text>
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, marginTop: 2 }}>Rate</Text>
        </View>
      </View>

      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surface.tertiary }}>
        <View style={{ height: '100%', borderRadius: 3, backgroundColor: c.intent.success, width: `${rate}%` }} />
      </View>
    </View>
  );
};

export default AdminOverviewCard;
