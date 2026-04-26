import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { StatusColors, PriorityColors, useThemeColors, FontWeight, Radius, FontSize } from '@/src/constants/theme';

export const STATUS_COLORS: Record<string, string> = { ...StatusColors };
export const PRIORITY_COLORS: Record<string, string> = { ...PriorityColors };

export type AppBadgeVariant = 'status' | 'priority' | 'role' | 'custom';

export interface AppBadgeProps {
  label:    string;
  variant?: AppBadgeVariant;
  color?:   string;
  style?:   StyleProp<ViewStyle>;
  size?:    'small' | 'medium';
}

const AppBadge: React.FC<AppBadgeProps> = ({
  label, variant = 'custom', color, style, size = 'small',
}) => {
  const c = useThemeColors();
  const resolvedColor =
    color ??
    (variant === 'status'   ? (StatusColors[label]   ?? c.text.muted) :
     variant === 'priority' ? (PriorityColors[label] ?? c.text.muted) :
     c.text.muted);

  const padding = size === 'small' ? { paddingHorizontal: 8, paddingVertical: 2 } : { paddingHorizontal: 12, paddingVertical: 4 };
  const fontSize = size === 'small' ? FontSize.xs : FontSize.sm;

  return (
    <View
      style={[
        {
          borderRadius: Radius.full,
          alignSelf: 'flex-start',
          borderWidth: 1,
          backgroundColor: `${resolvedColor}22`,
          borderColor: `${resolvedColor}66`,
          ...padding,
        },
        style,
      ]}
    >
      <Text style={{
        fontWeight: FontWeight.bold,
        fontSize,
        color: resolvedColor,
      }}>
        {label.replace(/_/g, ' ')}
      </Text>
    </View>
  );
};

export default AppBadge;
