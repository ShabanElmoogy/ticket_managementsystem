import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import type { IoniconName } from '@/src/components/layout/header/navItems';

export interface AdminOverviewCardProps {
  title:        string;
  icon:         IoniconName;
  iconColor:    string;
  total:        number;
  active:       number;
  activeLabel?: string;
  metricLabel?: string;
}

const AdminOverviewCard: React.FC<AdminOverviewCardProps> = ({
  title, icon, iconColor, total, active,
  activeLabel = 'Active',
  metricLabel = 'Active Rate',
}) => {
  const c    = useThemeColors();
  const rate = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <View style={{
      borderRadius:    Radius.lg,
      padding:         16,
      marginBottom:    12,
      backgroundColor: c.surface.primary,
      shadowColor:     c.shadow,
      shadowOffset:    { width: 0, height: 1 },
      shadowOpacity:   0.06,
      shadowRadius:    4,
      elevation:       2,
    }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Icon badge */}
          <View style={{
            width:           36,
            height:          36,
            borderRadius:    Radius.md,
            backgroundColor: iconColor + '20',
            alignItems:      'center',
            justifyContent:  'center',
          }}>
            <Ionicons name={icon} size={18} color={iconColor} />
          </View>
          <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.text.primary }}>
            {title}
          </Text>
        </View>

        {/* Rate badge */}
        <View style={{
          backgroundColor:  c.interactive.primary + '18',
          borderRadius:     20,
          paddingHorizontal: 10,
          paddingVertical:   3,
        }}>
          <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.interactive.primary }}>
            {rate}% {metricLabel}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: c.text.primary }}>
            {total.toLocaleString()}
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, marginTop: 2 }}>Total</Text>
        </View>
        <View>
          <Text style={{ fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: c.intent.success }}>
            {active.toLocaleString()}
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, marginTop: 2 }}>{activeLabel}</Text>
        </View>
        <View>
          <Text style={{ fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: c.interactive.primary }}>
            {rate}%
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, marginTop: 2 }}>Rate</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surface.tertiary }}>
        <View style={{
          height:          '100%',
          borderRadius:    3,
          backgroundColor: c.intent.success,
          width:           `${rate}%`,
        }} />
      </View>
    </View>
  );
};

export default AdminOverviewCard;
