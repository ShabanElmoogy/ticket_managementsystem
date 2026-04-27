import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Radius, FontSize, FontWeight, Spacing, LineHeight } from '@/src/constants/tokens';
import { useThemeColors } from '@/src/constants/theme';

export type HeaderIconButtonVariant = 'add' | 'export' | 'neutral';

export interface HeaderIconButtonProps {
  onPress:       () => void;
  label?:        string;
  icon?:         string;
  loading?:      boolean;
  disabled?:     boolean;
  loadingIcon?:  string;
  loadingLabel?: string;
  variant?:      HeaderIconButtonVariant;
}

const VARIANT_DEFAULTS: Record<HeaderIconButtonVariant, { icon: string; label: string }> = {
  add:     { icon: '➕', label: 'Add'        },
  export:  { icon: '📄', label: 'Export PDF' },
  neutral: { icon: '🔧', label: 'Action'     },
};

/**
 * HeaderIconButton — compact square button with icon above label.
 * Used in admin screen headers for Add / Export / custom actions.
 * Replaces the separate AddButton and ExportPdfButton components.
 */
const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  onPress,
  variant      = 'neutral',
  loading      = false,
  disabled     = false,
  loadingIcon  = '⏳',
  loadingLabel,
  icon,
  label,
}) => {
  const c          = useThemeColors();
  const isDisabled = loading || disabled;

  const defaults   = VARIANT_DEFAULTS[variant];
  const displayIcon  = loading ? loadingIcon : disabled ? '🚫' : (icon  ?? defaults.icon);
  const displayLabel = loading ? (loadingLabel ?? defaults.label) : (label ?? defaults.label);

  const getBg = (pressed: boolean): string => {
    if (isDisabled) return c.buttons.neutral.bg;
    switch (variant) {
      case 'add':    return pressed ? c.buttons.success.pressed : c.buttons.success.bg;
      case 'export': return pressed ? c.buttons.danger.pressed  : c.buttons.danger.bg;
      default:       return pressed ? c.buttons.neutral.pressed : c.buttons.neutral.bg;
    }
  };

  const shadowColor = variant === 'add'    ? c.buttons.success.bg
                    : variant === 'export' ? c.buttons.danger.bg
                    : c.buttons.neutral.bg;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel={displayLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }: { pressed: boolean }) => ({
        alignItems:        'center',
        justifyContent:    'center',
        minHeight:         44,
        paddingHorizontal: Spacing.md,
        borderRadius:      Radius.lg,
        backgroundColor:   getBg(pressed),
        opacity:           isDisabled ? 0.4 : 1,
        ...Platform.select({
          ios: {
            shadowColor,
            shadowOffset:  { width: 0, height: pressed || isDisabled ? 1 : 2 },
            shadowOpacity: isDisabled ? 0 : pressed ? 0.2 : 0.35,
            shadowRadius:  pressed ? 3 : 5,
          },
          android: { elevation: isDisabled ? 0 : 3 },
        }),
      })}
    >
      <View style={{ flexDirection: 'column', alignItems: 'center', gap: Spacing.xs }}>
        <Text style={{ fontSize: FontSize.xl, lineHeight: LineHeight.xl }}>{displayIcon}</Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize:   FontSize.xs,
            fontWeight: FontWeight.extrabold,
            lineHeight: LineHeight.xs,
            color:      variant === 'neutral' ? c.buttons.neutral.text : c.buttons.primary.text,
          }}
        >
          {displayLabel}
        </Text>
      </View>
    </Pressable>
  );
};

export default HeaderIconButton;
