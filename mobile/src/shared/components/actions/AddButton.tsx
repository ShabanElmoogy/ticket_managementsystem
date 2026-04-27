import React from 'react';
import { Platform, Pressable, PressableStateCallbackType, Text, View } from 'react-native';
import {
  Radius, FontSize, FontWeight, Spacing, LineHeight,
} from '@/src/constants/tokens';
import { useThemeColors } from '@/src/constants/theme';

export interface AddButtonProps {
  onPress:     () => void;
  label?:      string;
  /** Emoji or symbol rendered above the label. Defaults to ➕. */
  icon?:       string;
  loading?:    boolean;
}

/**
 * Green "Add" button — used in admin screen headers.
 * Column layout: icon above label, compact square-ish shape.
 */
const AddButton: React.FC<AddButtonProps> = ({
  onPress,
  label   = 'Add',
  icon    = '➕',
  loading = false,
}) => {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: loading, busy: loading }}
      style={({ pressed }: PressableStateCallbackType) => ({
        alignItems:        'center',
        justifyContent:    'center',
        minHeight:         44,
        paddingHorizontal: Spacing.md,
        borderRadius:      Radius.lg,
        backgroundColor:   pressed ? c.interactive.successPressed : c.interactive.success,
        opacity:           loading ? 0.5 : 1,
        ...Platform.select({
          ios: {
            shadowColor:   c.shadow,
            shadowOffset:  { width: 0, height: pressed || loading ? 1 : 2 },
            shadowOpacity: loading ? 0 : pressed ? 0.2 : 0.35,
            shadowRadius:  pressed ? 3 : 5,
          },
          android: {
            elevation: loading ? 0 : 3,
          },
        }),
      })}
    >
      <View style={{ flexDirection: 'column', alignItems: 'center', gap: Spacing.xs }}>
        <Text style={{ fontSize: FontSize.xl, lineHeight: LineHeight.xl }}>{icon}</Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize:   FontSize.xs,
            fontWeight: FontWeight.extrabold,
            lineHeight: LineHeight.xs,
            color:      c.text.primary,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

export default AddButton;
