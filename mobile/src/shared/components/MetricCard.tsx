import React from 'react';
import { View, Text } from 'react-native';
import AppCard from './AppCard';

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
}) => (
  <AppCard className="flex-1">
    <View className="flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
          {title}
        </Text>
        <Text className="text-3xl font-bold text-gray-900">
          {value}
          {suffix && <Text className="text-base font-normal text-gray-500">{suffix}</Text>}
        </Text>
      </View>
      {icon && (
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: color }}
        >
          {icon}
        </View>
      )}
    </View>
  </AppCard>
);

export default MetricCard;
