import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import AppButton from './AppButton';

export interface AppScreenHeaderProps {
  title: string;
  subtitle?: string;
  badge?: number | string;
  onAdd?: () => void;
  addLabel?: string;
  /** Rendered on the LEFT side (e.g. view toggle) */
  leftActions?: React.ReactNode;
  /** Rendered on the RIGHT side (legacy, kept for compatibility) */
  rightActions?: React.ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AppScreenHeader: React.FC<AppScreenHeaderProps> = ({
  title,
  subtitle,
  badge,
  onAdd,
  addLabel = 'Add',
  leftActions,
  rightActions,
  loading = false,
  style,
}) => (
  <View className="flex-row items-center px-4 py-3" style={style}>

    {/* Left — view toggle or custom left actions */}
    <View className="flex-row items-center" style={{ minWidth: 80 }}>
      {leftActions}
    </View>

    {/* Center — title + badge */}
    <View className="flex-1 items-center">
      <View className="flex-row items-center gap-1.5">
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
          {title}
        </Text>
        {badge !== undefined && (
          <View className="bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
            <Text className="text-xs font-semibold text-blue-600">{badge}</Text>
          </View>
        )}
      </View>
      {subtitle && (
        <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
      )}
    </View>

    {/* Right — Add button or custom right actions */}
    <View className="flex-row items-center gap-2 justify-end" style={{ minWidth: 80 }}>
      {rightActions}
      {onAdd && (
        <AppButton
          variant="contained"
          color="primary"
          size="small"
          loading={loading}
          onPress={onAdd}
        >
          + {addLabel}
        </AppButton>
      )}
    </View>

  </View>
);

export default AppScreenHeader;
