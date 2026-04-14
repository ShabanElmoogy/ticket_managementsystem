import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';

export const STATUS_COLORS: Record<string, string> = {
  OPEN:              '#f59e0b',
  IN_PROGRESS:       '#7c3aed',
  PROGRAMMING:       '#6366f1',
  UNDER_DEVELOPMENT: '#8b5cf6',
  CODE_REVIEW:       '#0ea5e9',
  TESTING:           '#06b6d4',
  RESOLVED:          '#10b981',
  CLOSED:            '#6b7280',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW:    '#10b981',
  MEDIUM: '#f59e0b',
  HIGH:   '#ef4444',
  URGENT: '#dc2626',
};

export type AppBadgeVariant = 'status' | 'priority' | 'role' | 'custom';

export interface AppBadgeProps {
  label: string;
  variant?: AppBadgeVariant;
  color?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'small' | 'medium';
}

const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  variant = 'custom',
  color,
  style,
  size = 'small',
}) => {
  const resolvedColor =
    color ??
    (variant === 'status'   ? (STATUS_COLORS[label]   ?? '#6b7280') :
     variant === 'priority' ? (PRIORITY_COLORS[label] ?? '#6b7280') :
     '#6b7280');

  const paddingClass = size === 'small' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textClass    = size === 'small' ? 'text-xs'     : 'text-sm';

  return (
    <View
      className={`rounded-full self-start border ${paddingClass}`}
      style={[{ backgroundColor: `${resolvedColor}22`, borderColor: `${resolvedColor}66` }, style]}
    >
      <Text
        className={`font-bold ${textClass}`}
        style={{ color: resolvedColor }}
      >
        {label.replace(/_/g, ' ')}
      </Text>
    </View>
  );
};

export default AppBadge;
