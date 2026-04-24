import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '../../../constants/theme';

export interface ActionRowProps {
  badgeContent:  React.ReactNode;
  badgeColor:    string;
  badgeGlow?:    boolean;
  title:         string;
  subtitle?:     string;
  rightSlot?:    React.ReactNode;
  pressedBg?:    string;
  onPress:       () => void;
  disabled?:     boolean;
  loading?:      boolean;
  busyOpacity?:  number;
  isDark?:       boolean;
}

const ActionRow: React.FC<ActionRowProps> = ({
  badgeContent, badgeColor, badgeGlow = false,
  title, subtitle, rightSlot, pressedBg,
  onPress, disabled = false, loading = false, busyOpacity = 0.55,
}) => {
  const c = useThemeColors();
  const defaultPressedBg = pressedBg ?? c.interactive.pressed;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 14, paddingVertical: 13,
        backgroundColor: pressed ? defaultPressedBg : 'transparent',
        opacity: (disabled || loading) ? busyOpacity : 1,
      })}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: badgeColor,
        alignItems: 'center', justifyContent: 'center',
        ...(badgeGlow && {
          shadowColor: badgeColor, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4, shadowRadius: 5, elevation: 3,
        }),
      }}>
        {loading ? <ActivityIndicator size="small" color={c.text.inverse} /> : badgeContent}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text.primary }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={{ fontSize: FontSize.xs, color: c.text.secondary, marginTop: 1 }}>
            {subtitle}
          </Text>
        )}
      </View>

      {!!rightSlot && rightSlot}
    </Pressable>
  );
};

export default ActionRow;
