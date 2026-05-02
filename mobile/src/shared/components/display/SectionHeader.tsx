import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';

/**
 * SectionHeader
 *
 * A horizontal header row used at the top of cards and list sections.
 * Renders a bold title on the left and an optional slot on the right
 * (typically a `CountBadge` or action button).
 *
 * ## Layout
 * ```
 * ┌─────────────────────────────────────────┐
 * │  Title                       [right]    │
 * └─────────────────────────────────────────┘  ← bottom border
 * ```
 *
 * ## Usage locations
 * - `DataCard.tsx`              — card header with `CountBadge` on the right
 * - `ReportCardHeader.tsx`      — report card header with `CountBadge`
 * - `AdminDashboardScreen.tsx`  — plain section dividers (no right slot)
 *
 * ## Modal safety
 * ✅ Modal-safe — `useThemeColors()` is called at component level.
 *
 * @example
 * // With count badge
 * <SectionHeader
 *   title="Customers"
 *   right={<CountBadge count={rows.length} total={totalCount} isFiltered={isFiltered} />}
 * />
 *
 * @example
 * // Plain section divider
 * <SectionHeader title={t('adminDashboard.statistics')} />
 */
export interface SectionHeaderProps {
  /** Section title displayed on the left. Clamped to one line. */
  title: string;
  /**
   * Optional node rendered flush to the right edge.
   * Common values: `CountBadge`, an action `Pressable`, or a status chip.
   */
  right?: React.ReactNode;
  /** Extra style merged onto the root `View`. */
  style?: ViewStyle;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, right, style }) => {
  const c = useThemeColors();

  return (
    <View
      accessibilityRole="header"
      style={[
        {
          flexDirection:     'row',
          alignItems:        'center',
          paddingHorizontal: 16,
          paddingVertical:   10,
          borderBottomWidth: 1,
          borderBottomColor: c.border.primary,
          backgroundColor:   c.surface.tertiary,
        },
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={{
          flex:       1,
          fontSize:   FontSize.md,
          fontWeight: FontWeight.bold,
          color:      c.text.primary,
        }}
      >
        {title}
      </Text>

      {/* Right slot — flexShrink:0 prevents it from being squeezed by a long title */}
      {right != null && (
        <View style={{ flexShrink: 0, marginStart: 8 }}>
          {right}
        </View>
      )}
    </View>
  );
};

export default SectionHeader;
