import React from 'react';
import { Pressable, Text } from 'react-native';
import { Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import { useThemeColors } from '@/src/constants/theme';

export interface OutlineButtonProps {
  /** Emoji or short string shown left of the label */
  icon?:       string;
  label:       string;
  onPress:     () => void;
  disabled?:   boolean;
  /** @deprecated — component reads theme internally via useThemeColors() */
  isDark?:     boolean;
  /** Stretch to fill available flex space (default true) */
  flex?:       boolean;
  minHeight?:  number;
}

/**
 * OutlineButton — a bordered pill button with an optional icon and label.
 * Uses semantic theme tokens — no raw hex strings.
 */
const OutlineButton: React.FC<OutlineButtonProps> = ({
  icon,
  label,
  onPress,
  disabled  = false,
  flex      = true,
  minHeight = 58,
}) => {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        ...(flex && { flex: 1 }),
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'center',
        paddingVertical:   18,
        paddingHorizontal: 10,
        minHeight,
        borderRadius:      Radius.xl,
        borderWidth:       1.5,
        borderColor:       c.border.secondary,
        backgroundColor:   pressed ? c.interactive.pressed : c.surface.primary,
        opacity:           disabled ? 0.5 : 1,
      })}
    >
      {!!icon && (
        <Text style={{ fontSize: FontSize['2xl'], marginEnd: 8 }}>{icon}</Text>
      )}
      <Text style={{
        fontSize:      FontSize.xl,
        fontWeight:    FontWeight.bold,
        color:         c.text.secondary,
        letterSpacing: 0.2,
      }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default OutlineButton;
