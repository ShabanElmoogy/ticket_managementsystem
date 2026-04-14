import React from 'react';
import { View, Text } from 'react-native';
import AppCard from './AppCard';

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
  const rate = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <AppCard>
      <Text className="text-base font-bold text-gray-900 mb-1.5">{title}</Text>
      <Text className="text-sm text-gray-500 mb-2">
        {total} total, {active} currently {activeLabel}.
      </Text>
      <View className="flex-row items-center gap-1.5 mb-1.5">
        <Text className="text-sm text-gray-500">{metricLabel}:</Text>
        <Text className="text-base font-bold text-blue-600">{rate}%</Text>
      </View>
      {/* Progress bar */}
      <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <View className="h-full bg-blue-600 rounded-full" style={{ width: `${rate}%` }} />
      </View>
    </AppCard>
  );
};

export default OverviewCard;
