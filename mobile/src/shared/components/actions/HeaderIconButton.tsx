import React, { useEffect, useRef, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Animated, Easing } = require('react-native') as { Animated: any; Easing: any };
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing } from '@/src/constants/tokens';
import { useThemeColors } from '@/src/constants/theme';
import type { IoniconName } from '@/src/components/layout/header/navItems';

/**
 * HeaderIconButton — compact square button with icon above label.
 * Used in admin screen headers for Add / Export / Refresh / custom actions.
 *
 * Variants:
 *   add     — palette accent tint bg (theme-aware, matches active palette), accent text
 *   export  — error tint bg, error text
 *   refresh — neutral bg, spinning animation on press/loading
 *   neutral — neutral bg, secondary text (default)
 *
 * ⚠️ Modal safety: NOT safe inside <Modal> — calls useThemeColors() internally.
 */

export type HeaderIconButtonVariant = 'add' | 'export' | 'refresh' | 'neutral';

export interface HeaderIconButtonProps {
  onPress:       () => void;
  variant?:      HeaderIconButtonVariant;
  label?:        string;
  icon?:         IoniconName;
  loading?:      boolean;
  disabled?:     boolean;
  loadingLabel?: string;
}

const DEFAULTS: Record<HeaderIconButtonVariant, { icon: IoniconName; label: string }> = {
  add:     { icon: 'add-circle-outline', label: 'Add'        },
  export:  { icon: 'document-outline',   label: 'Export PDF' },
  refresh: { icon: 'refresh-outline',    label: 'Refresh'    },
  neutral: { icon: 'ellipsis-horizontal',label: 'Action'     },
};

const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  onPress,
  variant      = 'neutral',
  loading      = false,
  disabled     = false,
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

  // ── Colors — fully theme-aware ────────────────────────────────────────────
  // Add: uses active palette accent (matches current theme)
  // Export: uses error color (red — destructive/irreversible action)
  // Refresh/Neutral: uses elevated surface
  const bg = isDisabled          ? c.surface.elevated
           : variant === 'add'    ? c.interactive.primary + '20'
           : variant === 'export' ? c.intent.error        + '20'
           : c.surface.elevated;

  const bgPressed = isDisabled          ? c.surface.elevated
                  : variant === 'add'    ? c.interactive.primary + '35'
                  : variant === 'export' ? c.intent.error        + '35'
                  : c.surface.tertiary;

  const iconColor = isDisabled          ? c.text.muted
                  : c.interactive.primary;

  const textColor = iconColor;

  // ── Display values ─────────────────────────────────────────────────────────
  const defaults     = DEFAULTS[variant];
  const displayIcon  = loading ? 'hourglass-outline' : disabled ? 'ban-outline' : (icon ?? defaults.icon);
  const displayLabel = loading ? (loadingLabel ?? defaults.label) : (label ?? defaults.label);

  const iconNode = isRefresh ? (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Ionicons name={displayIcon} size={20} color={iconColor} />
    </Animated.View>
  ) : (
    <Ionicons name={displayIcon} size={20} color={iconColor} />
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
        <Text numberOfLines={1} style={{ fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: textColor }}>
          {displayLabel}
        </Text>
      </View>
    </Pressable>
  );
};

export default HeaderIconButton;
