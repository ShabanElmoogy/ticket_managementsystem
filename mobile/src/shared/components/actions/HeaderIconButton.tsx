import React, { useEffect, useRef, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Animated, Easing } = require('react-native') as { Animated: any; Easing: any };
import { Radius, FontSize, FontWeight, Spacing, LineHeight } from '@/src/constants/tokens';
import { useThemeColors } from '@/src/constants/theme';

/**
 * HeaderIconButton — compact square button with icon above label.
 * Used in admin screen headers for Add / Export / Refresh / custom actions.
 *
 * Variants:
 *   add     — green tint bg, dark green text
 *   export  — red tint bg, dark red text
 *   refresh — neutral bg, spinning animation on press/loading
 *   neutral — neutral bg, secondary text (default)
 *
 * Usage locations: `HeaderActionGroup`
 *
 * ⚠️ Modal safety: NOT safe inside <Modal> — calls useThemeColors() internally.
 * Use only in screen-level headers, never inside a Modal tree.
 *
 * @example
 * <HeaderIconButton variant="add"     onPress={handleAdd}    label="Add Customer" />
 * <HeaderIconButton variant="export"  onPress={handleExport} loading={exporting} />
 * <HeaderIconButton variant="refresh" onPress={refetch}      loading={isLoading} />
 */

export type HeaderIconButtonVariant = 'add' | 'export' | 'refresh' | 'neutral';

export interface HeaderIconButtonProps {
  onPress:       () => void;
  variant?:      HeaderIconButtonVariant;
  label?:        string;
  icon?:         string;
  loading?:      boolean;
  disabled?:     boolean;
  loadingIcon?:  string;
  loadingLabel?: string;
}

const DEFAULTS: Record<HeaderIconButtonVariant, { icon: string; label: string }> = {
  add:     { icon: '➕',  label: 'Add'        },
  export:  { icon: '📄',  label: 'Export PDF' },
  refresh: { icon: '🔄',  label: 'Refresh'    },
  neutral: { icon: '🔧',  label: 'Action'     },
};

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
  const isRefresh  = variant === 'refresh';

  // ── Spin animation (refresh variant only) ─────────────────────────────────
  const rotation = useRef<any>(new Animated.Value(0)).current;
  const loopRef  = useRef<any>(null);

  const stopSpin = useCallback(() => {
    loopRef.current?.stop();
    loopRef.current = null;
    Animated.timing(rotation, { toValue: 0, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [rotation]);

  const startLoop = useCallback(() => {
    loopRef.current?.stop();
    rotation.setValue(0);
    loopRef.current = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 600, easing: Easing.linear, useNativeDriver: true }),
    );
    loopRef.current.start();
  }, [rotation]);

  useEffect(() => {
    if (!isRefresh) return;
    if (loading) startLoop(); else stopSpin();
    return () => { loopRef.current?.stop(); };
  }, [loading, isRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePress = useCallback(() => {
    if (isRefresh) {
      loopRef.current?.stop();
      rotation.setValue(0);
      Animated.timing(rotation, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }
    onPress();
  }, [rotation, onPress, isRefresh]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg        = isDisabled          ? c.surface.elevated
                  : variant === 'add'    ? '#dcfce7'   // green-100
                  : variant === 'export' ? '#fee2e2'   // red-100
                  : c.surface.tertiary;

  const bgPressed = isDisabled          ? c.surface.elevated
                  : variant === 'add'    ? '#bbf7d0'   // green-200
                  : variant === 'export' ? '#fecaca'   // red-200
                  : c.surface.elevated;

  const textColor = isDisabled          ? c.text.muted
                  : c.text.secondary;

  // ── Display values ─────────────────────────────────────────────────────────
  const defaults     = DEFAULTS[variant];
  const displayIcon  = loading ? loadingIcon : disabled ? '🚫' : (icon ?? defaults.icon);
  const displayLabel = loading ? (loadingLabel ?? defaults.label) : (label ?? defaults.label);

  const iconNode = isRefresh ? (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Text style={{ fontSize: FontSize.xl, lineHeight: LineHeight.xl }}>{displayIcon}</Text>
    </Animated.View>
  ) : (
    <Text style={{ fontSize: FontSize.xl, lineHeight: LineHeight.xl }}>{displayIcon}</Text>
  );

  return (
    <Pressable
      onPress={handlePress}
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
        backgroundColor:   pressed ? bgPressed : bg,
        opacity:           isDisabled ? 0.4 : 1,
      })}
    >
      <View style={{ flexDirection: 'column', alignItems: 'center', gap: Spacing.xs }}>
        {iconNode}
        <Text numberOfLines={1} style={{ fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, lineHeight: LineHeight.xs, color: textColor }}>
          {displayLabel}
        </Text>
      </View>
    </Pressable>
  );
};

export default HeaderIconButton;
