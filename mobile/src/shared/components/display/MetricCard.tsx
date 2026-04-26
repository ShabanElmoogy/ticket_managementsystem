import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  suffix?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color = '#2563eb',
  suffix,
}) => {
  const c = useThemeColors();
  
  return (
    <View style={{
      flex: 1,
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: FontSize.xs,
            fontWeight: FontWeight.bold,
            color: c.text.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 4,
          }}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{
              fontSize: FontSize['4xl'],
              fontWeight: FontWeight.bold,
              color: c.text.primary,
            }}>
              {value}
            </Text>
            {suffix && (
              <Text style={{
                fontSize: FontSize.base,
                fontWeight: FontWeight.normal,
                color: c.text.muted,
                marginStart: 2,
              }}>
                {suffix}
              </Text>
            )}
          </View>
        </View>
        {icon && (
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </View>
        )}
      </View>
    </View>
  );
};

export default MetricCard;
