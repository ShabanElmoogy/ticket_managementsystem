/**
 * TicketCardGrid — 2-column compact card layout for a ticket card.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────────────────╮
 * │  ┌─ top strip ──────────────────────────────────────────────────┐   │
 * │  │  [●] [◉] IN PROGRESS                                         │   │
 * │  └──────────────────────────────────────────────────────────────┘   │
 * │                                                                      │
 * │  [JD] John Doe                                          2h ago  [⋮] │  ← TicketCardHeader
 * │  [OPEN] [HIGH] [OVERDUE ●] [⏱ 2h left]                            │  ← TicketCardBadgeRow
 * │                                                                      │
 * │  Login page crashes on Safari                                        │  ← TicketCardContent
 * │  Users report a blank screen when navigating to /login...            │
 * │                                                                      │
 * │  📅 Dec 15, 2024   [JD] Jane Doe   ⏱ 4h                           │  ← TicketCardMeta
 * │──────────────────────────────────────────────────────────────────────│
 * │  💬 3   📊 Activity   ✅ Take   [⋮]                               │  ← TicketCardActionBar
 * ╰──────────────────────────────────────────────────────────────────────╯
 *
 * Differences from feed mode:
 *   - Compact top strip showing status icon + status label
 *   - No Share button (sharingAvailable=false)
 *   - No inline comments section
 *   - Description capped at 3 lines (disableToggle)
 *   - minHeight: 330 to keep grid rows uniform
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - `TicketCard/index.tsx` — rendered when `viewMode === 'grid'`
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing } from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket } from '@/src/services/api/types/ticket';

import TicketCardHeader    from './TicketCardHeader';
import TicketCardBadgeRow  from './TicketCardBadgeRow';
import TicketCardContent   from './TicketCardContent';
import TicketCardMeta      from './TicketCardMeta';
import TicketCardActionBar from './TicketCardActionBar';
import TicketCardOverflowMenu from './TicketCardOverflowMenu';
import type { TicketCardOverflowMenuProps } from './TicketCardOverflowMenu';
import type { TicketCardActionBarProps } from './TicketCardActionBar';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps ticket status values to Ionicons glyph names for the top strip icon.
 * Module-level constant — safe to define here (no theme dependency).
 */
const STATUS_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  OPEN:              'radio-button-on-outline',
  IN_PROGRESS:       'sync-outline',
  PROGRAMMING:       'code-slash-outline',
  UNDER_DEVELOPMENT: 'hammer-outline',
  CODE_REVIEW:       'git-compare-outline',
  TESTING:           'flask-outline',
  RESOLVED:          'checkmark-circle-outline',
  CLOSED:            'lock-closed-outline',
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCardGridProps {
  /** The ticket data to display. */
  ticket: Ticket;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** Called when the card content area is pressed (navigate to detail). */
  onPress: () => void;
  /** Called when the comment button is pressed. */
  onCommentPress: () => void;
  /** Called when the activity button is pressed. */
  onActivityPress: () => void;
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
  /**
   * Props forwarded directly to TicketCardActionBar (minus the ones
   * managed by TicketCardGrid itself).
   */
  actionBarProps: Omit<
    TicketCardActionBarProps,
    | 'ticket'
    | 'resolvedColors'
    | 'onCommentPress'
    | 'onActivityPress'
    | 'onSharePress'
    | 'sharingAvailable'
    | 'onOverflowMenuPress'
    | 'style'
  >;
  /** Props forwarded directly to TicketCardOverflowMenu. */
  overflowMenuProps: Omit<
    TicketCardOverflowMenuProps,
    'visible' | 'onClose' | 'ticket' | 'resolvedColors'
  >;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketCardGrid: React.FC<TicketCardGridProps> = ({
  ticket,
  resolvedColors: c,
  onPress,
  onCommentPress,
  onActivityPress,
  onOverflowMenuPress,
  overflowMenuOpen,
  onOverflowMenuClose,
  cardBorderColor,
  style,
  actionBarProps,
  overflowMenuProps,
}) => {
  const statusIcon  = STATUS_ICON_MAP[ticket.status] ?? 'information-circle-outline';
  const statusLabel = ticket.status.replace(/_/g, ' ');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.surface.card,
          borderColor: cardBorderColor,
          shadowColor: c.shadow,
        },
        style,
      ]}
    >
      {/* ── Top strip — status icon + status label ──────────────────────── */}
      <View
        style={[
          styles.topStrip,
          {
            borderBottomColor: c.border.primary,
            backgroundColor: c.surface.elevated,
          },
        ]}
      >
        {/* Status icon badge */}
        <View
          style={[
            styles.statusIconBadge,
            {
              borderColor: c.border.primary,
              backgroundColor: c.surface.card,
            },
          ]}
        >
          <Ionicons name={statusIcon} size={13} color={c.interactive.primary} />
        </View>

        {/* Status pill */}
        <View
          style={[
            styles.statusPill,
            { backgroundColor: `${c.interactive.primary}22` },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: c.interactive.primary }]}
          />
          <Ionicons name="pricetag-outline" size={10} color={c.interactive.primary} />
        </View>

        {/* Status label */}
        <View style={styles.statusLabelWrap}>
          <Text
            style={[styles.statusLabel, { color: c.text.secondary }]}
            numberOfLines={1}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* ── Card body ───────────────────────────────────────────────────── */}
      <View style={styles.body}>
        {/* Header */}
        <TicketCardHeader
          ticket={ticket}
          resolvedColors={c}
          onOverflowPress={onOverflowMenuPress}
        />

        {/* Badge row */}
        <TicketCardBadgeRow
          ticket={ticket}
          resolvedColors={c}
          style={styles.badgeRow}
        />

        {/* Content — 3 lines max, no See more toggle */}
        <TicketCardContent
          ticket={ticket}
          resolvedColors={c}
          onPress={() => onPress()}
          expanded={false}
          disableToggle
          descriptionLines={3}
        />
      </View>

      {/* ── Card bottom ─────────────────────────────────────────────────── */}
      <View style={styles.bottom}>
        {/* Meta row */}
        <TicketCardMeta
          ticket={ticket}
          resolvedColors={c}
          style={styles.metaRow}
        />

        {/* Action bar — Share intentionally omitted for grid mode */}
        <TicketCardActionBar
          ticket={ticket}
          resolvedColors={c}
          onCommentPress={onCommentPress}
          onActivityPress={onActivityPress}
          sharingAvailable={false}
          onOverflowMenuPress={onOverflowMenuPress}
          {...actionBarProps}
        />
      </View>

      {/* ── Overflow menu bottom sheet ──────────────────────────────────── */}
      <TicketCardOverflowMenu
        visible={overflowMenuOpen}
        onClose={onOverflowMenuClose}
        ticket={ticket}
        resolvedColors={c}
        {...overflowMenuProps}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Card container ─────────────────────────────────────────────────────────
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing.sm,
    gap: Spacing.xs,
    minHeight: 330,
    // Shadow values (shadowColor overridden inline with c.shadow)
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Top strip ──────────────────────────────────────────────────────────────
  topStrip: {
    minHeight: 30,
    marginHorizontal: -Spacing.sm,
    marginTop: -Spacing.sm,
    marginBottom: 4,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  statusIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    marginStart: 8,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabelWrap: {
    marginStart: 8,
    flex: 1,
  },
  statusLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'capitalize',
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
  },
  badgeRow: {
    paddingTop: Spacing.xs,
  },

  // ── Bottom ─────────────────────────────────────────────────────────────────
  bottom: {
    marginTop: 'auto',
  },
  metaRow: {
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
  },
});

export default TicketCardGrid;
