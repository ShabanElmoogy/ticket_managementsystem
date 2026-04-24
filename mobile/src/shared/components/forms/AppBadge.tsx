import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { StatusColors, PriorityColors, useThemeColors, FontWeight } from '../../../constants/theme';

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

  const paddingClass = size === 'small' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textClass    = size === 'small' ? 'text-xs'     : 'text-sm';

  return (
    <View
      className={`rounded-full self-start border ${paddingClass}`}
      style={[{ backgroundColor: `${resolvedColor}22`, borderColor: `${resolvedColor}66` }, style]}
    >
      <Text className={`font-bold ${textClass}`} style={{ color: resolvedColor }}>
        {label.replace(/_/g, ' ')}
      </Text>
    </View>
  );
};

export default AppBadge;
