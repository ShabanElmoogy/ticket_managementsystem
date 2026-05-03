import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';
import AppButton from '@/src/shared/components/forms/AppButton';

/**
 * AppEmptyState
 *
 * A centered placeholder shown when a list or screen has no content.
 * Renders an optional emoji icon, a primary message, an optional subtitle,
 * and an optional action button.
 *
 * ## Layout
 * ```
 *        [icon]
 *       Message
 *      subtitle
 *    [Action button]
 * ```
 *
 * ## Usage locations
 * - `DataCard.tsx`    — `ListEmptyComponent` for grid and compact views
 * - `ReportCard`      — empty state when report has no rows
 *
 * ## Modal safety
 * ✅ Modal-safe — `useThemeColors()` is called at component level.
 *
 * @example
 * // FlatList empty state
 * <FlatList
 *   ListEmptyComponent={
 *     <AppEmptyState fill icon="📭" message="No customers yet" />
 *   }
 * />
 *
 * @example
 * // Filtered empty state with action
 * <AppEmptyState
 *   icon="🔍"
 *   message='No results found'
 *   subtitle={`No rows match "${search}"`}
 *   actionLabel="Clear filter"
 *   onAction={clearSearch}
 * />
 */
export interface AppEmptyStateProps {
  /** Emoji displayed above the message. */
  icon?: string;
  /** Primary message. */
  message: string;
  /** Secondary line below the message. */
  subtitle?: string;
  /**
   * Label for the optional action button.
   * Requires `onAction` to be set.
   */
  actionLabel?: string;
  /**
   * Called when the action button is pressed.
   * Requires `actionLabel` to be set.
   */
  onAction?: () => void;
  /**
   * When `true`, the root `View` uses `flex: 1` to fill its parent.
   * Use this inside `FlatList.ListEmptyComponent` or full-screen empty states.
   * @default false
   */
  fill?: boolean;
  /** Extra style merged onto the root `View`. */
  style?: ViewStyle;
}

const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  icon,
  message,
  subtitle,
  actionLabel,
  onAction,
  fill  = false,
  style,
}) => {
  const c          = useThemeColors();
  const hasAction  = !!actionLabel && !!onAction;

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
      {!!icon && (
        <Text style={{ fontSize: 48, marginBottom: 16 }}>
          {icon}
        </Text>
      )}

      <Text style={{
        fontSize:    FontSize.lg,
        fontWeight:  FontWeight.semibold,
        color:       c.text.primary,
        textAlign:   'center',
        marginBottom: subtitle || hasAction ? 8 : 0,
      }}>
        {message}
      </Text>

      {!!subtitle && (
        <Text style={{
          fontSize:    FontSize.sm,
          color:       c.text.muted,
          textAlign:   'center',
          marginBottom: hasAction ? 16 : 0,
        }}>
          {subtitle}
        </Text>
      )}

      {hasAction && (
        <AppButton
          variant="outlined"
          onPress={onAction}
          style={{ marginTop: 8 }}
        >
          {actionLabel}
        </AppButton>
      )}
    </View>
  );
};

export default AppEmptyState;
