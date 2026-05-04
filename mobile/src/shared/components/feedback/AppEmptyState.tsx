import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';
import AppButton from '@/src/shared/components/forms/AppButton';
import type { IoniconName } from '@/src/components/layout/header/navItems';

/**
 * AppEmptyState
 *
 * A centered placeholder shown when a list or screen has no content.
 * Renders an optional icon (Ionicons or emoji), a primary message, an optional
 * subtitle, and an optional action button.
 *
 * ## Usage
 * ```tsx
 * // Ionicons icon with theme color
 * <AppEmptyState
 *   ionicon="calendar-outline"
 *   ioniconColor={c.tint}
 *   message="No visits yet"
 *   actionLabel="Log First Visit"
 *   actionIcon="add-circle-outline"
 *   onAction={handleLogVisit}
 * />
 *
 * // Legacy emoji icon
 * <AppEmptyState icon="📭" message="No customers yet" />
 * ```
 *
 * @modal-safety ✅ Modal-safe — useThemeColors() called at component level.
 */
export interface AppEmptyStateProps {
  /** Ionicons icon name — preferred over emoji `icon` */
  ionicon?:      IoniconName;
  /** Color for the Ionicons icon. Defaults to c.text.muted */
  ioniconColor?: string;
  /** Size for the Ionicons icon. Defaults to 56 */
  ioniconSize?:  number;
  /** Legacy emoji icon — use `ionicon` for new code */
  icon?:         string;
  /** Primary message */
  message:       string;
  /** Secondary line below the message */
  subtitle?:     string;
  /** Label for the optional action button */
  actionLabel?:  string;
  /** Ionicons icon shown inside the action button */
  actionIcon?:   IoniconName;
  /** Called when the action button is pressed */
  onAction?:     () => void;
  /** When true, root View uses flex:1 to fill parent */
  fill?:         boolean;
  style?:        ViewStyle;
}

const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  ionicon, ioniconColor, ioniconSize = 56,
  icon,
  message, subtitle,
  actionLabel, actionIcon, onAction,
  fill  = false,
  style,
}) => {
  const c         = useThemeColors();
  const hasAction = !!actionLabel && !!onAction;

  return (
    <View
      accessibilityRole="none"
      accessibilityLabel={subtitle ? `${message}. ${subtitle}` : message}
      style={[
        {
          alignItems:     'center',
          justifyContent: 'center',
          padding:        32,
          ...(fill && { flex: 1 }),
        },
        style,
      ]}
    >
      {/* Ionicons icon — preferred */}
      {!!ionicon && (
        <View style={{
          width:           80,
          height:          80,
          borderRadius:    40,
          backgroundColor: (ioniconColor ?? c.tint) + '15',
          alignItems:      'center',
          justifyContent:  'center',
          marginBottom:    16,
        }}>
          <Ionicons
            name={ionicon}
            size={ioniconSize}
            color={ioniconColor ?? c.tint}
          />
        </View>
      )}

      {/* Legacy emoji icon */}
      {!ionicon && !!icon && (
        <Text style={{ fontSize: 48, marginBottom: 16 }}>
          {icon}
        </Text>
      )}

      <Text style={{
        fontSize:     FontSize.lg,
        fontWeight:   FontWeight.semibold,
        color:        c.text.primary,
        textAlign:    'center',
        marginBottom: subtitle || hasAction ? 8 : 0,
      }}>
        {message}
      </Text>

      {!!subtitle && (
        <Text style={{
          fontSize:     FontSize.sm,
          color:        c.text.muted,
          textAlign:    'center',
          marginBottom: hasAction ? 16 : 0,
        }}>
          {subtitle}
        </Text>
      )}

      {hasAction && (
        <AppButton
          variant="primary"
          onPress={onAction}
          resolvedColors={c}
          style={{ marginTop: 12 }}
          leftIcon={actionIcon
            ? <Ionicons name={actionIcon} size={16} color="#ffffff" />
            : undefined
          }
        >
          {actionLabel}
        </AppButton>
      )}
    </View>
  );
};

export default AppEmptyState;
