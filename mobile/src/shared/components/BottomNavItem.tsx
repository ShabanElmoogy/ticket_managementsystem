import React from 'react';
import { View, Text, Pressable } from 'react-native';

export interface BottomNavItemProps {
  /** Icon to show when inactive */
  icon: string;
  /** Icon to show when active (falls back to icon if not provided) */
  activeIcon?: string;
  /** Label shown below the icon */
  label: string;
  /** Whether this item is currently active */
  isActive: boolean;
  /** Dark mode flag */
  isDark?: boolean;
  /** Active accent color (default: #2563eb — blue-600) */
  activeColor?: string;
  /** On press handler */
  onPress?: () => void;
}

/**
 * BottomNavItem — a single tab in a bottom navigation bar.
 * Reusable: no dependency on routing or tab config.
 */
const BottomNavItem: React.FC<BottomNavItemProps> = ({
  icon,
  activeIcon,
  label,
  isActive,
  isDark = false,
  activeColor = '#2563eb',
  onPress,
}) => (
  <Pressable
    className="flex-1 items-center justify-center gap-0.5"
    onPress={onPress}
  >
    {/* Active indicator bar */}
    {isActive && (
      <View
        className="absolute top-0 w-6 h-0.5 rounded-full"
        style={{ backgroundColor: activeColor, marginLeft: -12, left: '50%' }}
      />
    )}

    <Text className={`text-2xl ${isActive ? 'opacity-100' : 'opacity-40'}`}>
      {isActive ? (activeIcon ?? icon) : icon}
    </Text>

    <Text
      className={`text-xs font-medium ${
        isDark ? 'text-gray-500' : 'text-gray-400'
      }`}
      style={isActive ? { color: activeColor } : undefined}
    >
      {label}
    </Text>
  </Pressable>
);

export default BottomNavItem;
