/**
 * TicketCardCompact — dense single-line row layout for a ticket card.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────────────────╮
 * │  ● Login page crashes on Safari          [IN PROGRESS]  [⋮]         │
 * ╰──────────────────────────────────────────────────────────────────────╯
 *
 * Left to right (single row):
 *   1. Priority dot (8×8 colored circle)
 *   2. Ticket title (flex 1, truncated to 1 line)
 *   3. Status badge (pill chip)
 *   4. Three-dot overflow menu trigger
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - `TicketCard/index.tsx` — rendered when `viewMode === 'compact'`
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing } from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket } from '@/src/services/api/types/ticket';
import TicketCardOverflowMenu from './TicketCardOverflowMenu';
import type { TicketCardOverflowMenuProps } from './TicketCardOverflowMenu';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the priority dot color for the given priority string.
 * Falls back to the theme's success intent color for LOW / unknown values.
 */
function getPriorityColor(priority: string, c: ThemeColors): string {
  switch (priority) {
    case 'URGENT': return c.intent.error;
    case 'HIGH':   return c.intent.warning;
    case 'MEDIUM': return c.interactive.primary;
    default:       return c.intent.success;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCardCompactProps {
  /** The ticket data to display. */
  ticket: Ticket;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** Called when the card row is pressed (navigate to detail). */
  onPress: () => void;
  /** Called when the three-dot overflow menu button is pressed. */
  onOverflowMenuPress: () => void;
  /** Whether the overflow menu bottom sheet is currently open. */
  overflowMenuOpen: boolean;
  /** Called when the overflow menu requests to close. */
  onOverflowMenuClose: () => void;
  /** Border color for the card — reflects selection state. */
  cardBorderColor: string;
  /** Extra style merged onto the root card container. */
  style?: ViewStyle;
  /** Props forwarded directly to TicketCardOverflowMenu. */
  overflowMenuProps: Omit<
    TicketCardOverflowMenuProps,
    'visible' | 'onClose' | 'ticket' | 'resolvedColors'
  >;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketCardCompact: React.FC<TicketCardCompactProps> = ({
  ticket,
  resolvedColors: c,
  onPress,
  onOverflowMenuPress,
  overflowMenuOpen,
  onOverflowMenuClose,
  cardBorderColor,
  style,
  overflowMenuProps,
}) => {
  const priorityColor = getPriorityColor(ticket.priority, c);
  // Use the interactive primary color as the status color — consistent with
  // the STATUS_ICON_MAP usage in the original index.tsx compact branch.
  const statusColor   = c.interactive.primary;
  const statusLabel   = ticket.status.replace(/_/g, ' ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        {
          backgroundColor: c.surface.card,
          borderColor: cardBorderColor,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Ticket: ${ticket.title}`}
    >
      {/* ── Single row: priority dot + title + status badge + overflow ── */}
      <View style={styles.row}>
        {/* Priority dot */}
        <View
          style={[styles.priorityDot, { backgroundColor: priorityColor }]}
          accessibilityElementsHidden
        />

        {/* Title */}
        <Text
          style={[styles.title, { color: c.text.primary }]}
          numberOfLines={1}
        >
          {ticket.title}
        </Text>

        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: `${statusColor}18`,
              borderColor: `${statusColor}44`,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>

        {/* Overflow menu trigger */}
        <Pressable
          onPress={onOverflowMenuPress}
          style={styles.overflowButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <Ionicons name="ellipsis-horizontal" size={14} color={c.text.muted} />
        </Pressable>
      </View>

      {/* ── Overflow menu bottom sheet ──────────────────────────────────── */}
      <TicketCardOverflowMenu
        visible={overflowMenuOpen}
        onClose={onOverflowMenuClose}
        ticket={ticket}
        resolvedColors={c}
        {...overflowMenuProps}
      />
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },
  overflowButton: {
    padding: 4,
    flexShrink: 0,
  },
});

export default TicketCardCompact;
