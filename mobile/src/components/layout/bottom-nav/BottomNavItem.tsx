import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { TabItem } from './tabItems';

interface Props {
  tab: TabItem;
  isActive: boolean;
  isDark: boolean;
  onPress: () => void;
}

const BottomNavItem: React.FC<Props> = ({ tab, isActive, isDark, onPress }) => (
  <Pressable
    className="flex-1 items-center justify-center gap-0.5"
    onPress={onPress}
  >
    {/* Active indicator bar */}
    {isActive && (
      <View
        className="absolute top-0 w-6 h-0.5 bg-blue-600 rounded-full"
        style={{ marginLeft: -12, left: '50%' }}
      />
    )}

    <Text className={`text-2xl ${isActive ? 'opacity-100' : 'opacity-40'}`}>
      {isActive ? tab.activeIcon : tab.icon}
    </Text>

    <Text
      className={`text-xs font-medium ${
        isActive
          ? 'text-blue-600'
          : isDark ? 'text-gray-500' : 'text-gray-400'
      }`}
    >
      {tab.label}
    </Text>
  </Pressable>
);

export default BottomNavItem;
