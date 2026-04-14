import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import AppButton from './AppButton';

export interface AppScreenHeaderProps {
  title: string;
  subtitle?: string;
  badge?: number | string;
  onAdd?: () => void;
  addLabel?: string;
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
  rightActions,
  loading = false,
  style,
}) => (
  <View className="flex-row items-start justify-between px-4 py-3" style={style}>
    {/* Left */}
    <View className="flex-1 mr-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl font-bold text-gray-900">{title}</Text>
        {badge !== undefined && (
          <View className="bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
            <Text className="text-xs font-semibold text-blue-600">{badge}</Text>
          </View>
        )}
      </View>
      {subtitle && <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>}
    </View>

    {/* Right */}
    <View className="flex-row items-center gap-2">
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
