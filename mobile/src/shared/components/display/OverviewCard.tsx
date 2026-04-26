import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface OverviewCardProps {
  title: string;
  total: number;
  active: number;
  activeLabel?: string;
  metricLabel?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  total,
  active,
  activeLabel = 'active',
  metricLabel = 'Active Rate',
}) => {
  const c = useThemeColors();
  const rate = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <View style={{
      backgroundColor: c.surface.primary,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border.primary,
      padding: 16,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <Text style={{
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: c.text.primary,
        marginBottom: 6,
      }}>
        {title}
      </Text>
      
      <Text style={{
        fontSize: FontSize.sm,
        color: c.text.secondary,
        marginBottom: 8,
      }}>
        {total} total, {active} currently {activeLabel}.
      </Text>
      
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
      }}>
        <Text style={{
          fontSize: FontSize.sm,
          color: c.text.secondary,
        }}>
          {metricLabel}:
        </Text>
        <Text style={{
          fontSize: FontSize.base,
          fontWeight: FontWeight.bold,
          color: c.interactive.primary,
        }}>
          {rate}%
        </Text>
      </View>
      
      {/* Progress bar */}
      <View style={{
        height: 6,
        backgroundColor: c.surface.secondary,
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <View style={{
          height: '100%',
          backgroundColor: c.interactive.primary,
          borderRadius: 3,
          width: `${rate}%`,
        }} />
      </View>
    </View>
  );
};

export default OverviewCard;
