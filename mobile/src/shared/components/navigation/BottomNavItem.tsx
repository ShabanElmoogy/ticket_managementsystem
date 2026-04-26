import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

export interface BottomNavItemProps {
  /** Icon to show when inactive */
  icon: string;
  /** Icon to show when active (falls back to icon if not provided) */
  activeIcon?: string;
  /** Label shown below the icon */
  label: string;
  /** Whether this item is currently active */
  isActive: boolean;
  /** @deprecated — component reads theme internally via useThemeColors() */
  isDark?: boolean;
  /** Active accent color (default: interactive.primary from theme) */
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
  activeColor,
  onPress,
}) => {
  const c = useThemeColors();
  const finalActiveColor = activeColor || c.interactive.primary;

  return (
    <Pressable
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingVertical: 8,
      }}
      onPress={onPress}
    >
      {/* Active indicator bar */}
      {isActive && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            width: 24,
            height: 2,
            borderRadius: 999,
            backgroundColor: finalActiveColor,
            left: '50%',
            marginLeft: -12,
          }}
        />
      )}

      <Text
        style={{
          fontSize: 24,
          opacity: isActive ? 1 : 0.4,
        }}
      >
        {isActive ? (activeIcon ?? icon) : icon}
      </Text>

      <Text
        style={{
          fontSize: 12,
          fontWeight: '500',
          color: isActive ? finalActiveColor : c.text.secondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default BottomNavItem;
