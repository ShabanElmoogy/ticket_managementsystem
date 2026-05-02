import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

/**
 * CountBadge
 *
 * A small pill that shows a record count. Switches to amber when a filter
 * is active to signal that the displayed count is a subset of the total.
 *
 * ## Display logic
 * ```
 * isFiltered = false, total provided  →  "247 rows"   (total, not page slice)
 * isFiltered = false, no total        →  "12 rows"    (count)
 * isFiltered = true,  total provided  →  "3 / 247"    (filtered / total)
 * isFiltered = true,  no total        →  "3 rows"     (count only)
 * ```
 *
 * ## Usage locations
 * - `DataCard.tsx`         — header of every admin list card
 * - `ReportCardHeader.tsx` — header of report cards
 *
 * ## Modal safety
 * ✅ Modal-safe — `useThemeColors()` is called at component level.
 *
 * @example
 * // Unfiltered — shows total record count
 * <CountBadge count={rows.length} total={totalCount} isFiltered={false} />
 *
 * @example
 * // Filtered — shows "3 / 247"
 * <CountBadge count={filteredRows.length} total={totalCount} isFiltered={true} />
 */
export interface CountBadgeProps {
  /** Number of currently visible rows (current page or filtered result). */
  count: number;
  /**
   * Total record count before filtering / pagination.
   * When provided and `isFiltered` is false, this is shown instead of `count`
   * so the badge reflects the true total rather than the current page size.
   */
  total?: number;
  /**
   * When `true`, the badge turns amber and shows `count / total` to signal
   * that a filter is active.
   * @default false
   */
  isFiltered?: boolean;
  /**
   * Suffix label appended when showing a plain count (not filtered ratio).
   * @default "rows"
   */
  label?: string;
  /** Extra style merged onto the root `View`. */
  style?: ViewStyle;
}

const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  total,
  isFiltered = false,
  label      = 'rows',
  style,
}) => {
  const c     = useThemeColors();
  const color = isFiltered ? c.intent.warning : c.interactive.primary;

  // Resolve display text
  const displayCount = isFiltered
    ? total != null ? `${count} / ${total}` : `${count} ${label}`
    : total != null ? `${total} ${label}`   : `${count} ${label}`;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={displayCount}
      style={[
        {
          paddingHorizontal: 8,
          paddingVertical:   1,
          borderRadius:      Radius.md,
          backgroundColor:   color + '22',
        },
        style,
      ]}
    >
      <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color }}>
        {displayCount}
      </Text>
    </View>
  );
};

export default CountBadge;
