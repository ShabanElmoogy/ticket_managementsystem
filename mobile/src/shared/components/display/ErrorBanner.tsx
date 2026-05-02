import React from 'react';
import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

/**
 * ErrorBanner
 *
 * A full-width error strip with an optional retry button. Announces itself
 * as an accessibility alert so VoiceOver / TalkBack reads it immediately
 * when it appears on screen.
 *
 * ## Layout
 * ```
 * ┌─────────────────────────────────────────────┐
 * │  ⚠️  Error message text          [Retry]    │
 * └─────────────────────────────────────────────┘
 * ```
 *
 * ## Usage locations
 * - `ReportsScreen.tsx` — shown when the report data fetch fails
 *
 * ## Modal safety
 * ✅ Modal-safe — `useThemeColors()` is called at component level.
 *
 * @example
 * // With retry button
 * <ErrorBanner
 *   message="Failed to load data"
 *   onRetry={refetch}
 *   retryLabel={t('common.retry')}
 *   style={{ marginHorizontal: 16, marginBottom: 8 }}
 * />
 *
 * @example
 * // Read-only (no retry)
 * <ErrorBanner message={error.message} style={{ marginBottom: 12 }} />
 */
export interface ErrorBannerProps {
  /** Error message displayed in the banner. */
  message: string;
  /** Called when the retry button is pressed. Omit to hide the button. */
  onRetry?: () => void;
  /**
   * Label for the retry button.
   * Pass a translated string — e.g. `t('common.retry')`.
   * @default "Retry"
   */
  retryLabel?: string;
  /** Extra style merged onto the root `View`. Use for margin overrides. */
  style?: ViewStyle;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  retryLabel = 'Retry',
  style,
}) => {
  const c = useThemeColors();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={message}
      style={[
        {
          flexDirection:     'row',
          alignItems:        'center',
          paddingHorizontal: 14,
          paddingVertical:   10,
          borderRadius:      Radius.lg,
          borderWidth:       1,
          borderColor:       c.intent.error + '66',
          backgroundColor:   c.intent.errorSurface,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: FontSize.xl, marginEnd: 8 }}>⚠️</Text>

      <Text style={{ flex: 1, fontSize: FontSize.sm, color: c.intent.error, lineHeight: 17 }}>
        {message}
      </Text>

      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          style={({ pressed }: { pressed: boolean }) => ({
            paddingHorizontal: 10,
            paddingVertical:   5,
            borderRadius:      Radius.sm,
            marginStart:       8,
            backgroundColor:   pressed ? c.interactive.errorPressed : c.interactive.error,
          })}
        >
          <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.text.inverse }}>
            {retryLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default ErrorBanner;
