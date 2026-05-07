/**
 * TicketCardHeader — top row of a social-post ticket card.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────────────────╮
 * │  [JD]  John Doe                                          2h ago  [⋮] │
 * ╰──────────────────────────────────────────────────────────────────────╯
 *
 * - Initials avatar colored by ticket priority
 * - Creator name (primary text)
 * - Relative timestamp (secondary text, right-aligned)
 * - Three-dot overflow menu trigger button
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing, Palette } from '@/src/constants/tokens';
import { getInitials } from '@/src/shared/components/display/Avatar';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Priority → avatar color map (module-level — Palette constants)
// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_AVATAR_COLORS: Record<string, string> = {
  LOW:    Palette.emerald500,
  MEDIUM: Palette.amber500,
  HIGH:   Palette.orange500,
  URGENT: Palette.red500,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable relative timestamp.
 * e.g. "just now", "5m ago", "2h ago", "3d ago"
 */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  if (diffMs < 60_000) return 'just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  if (diffMs < 604_800_000) return `${Math.floor(diffMs / 86_400_000)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCardHeaderProps {
  /** The ticket data. */
  ticket: Ticket;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** Called when the three-dot overflow menu button is pressed. */
  onOverflowPress: () => void;
  /** Extra style merged onto the root container. */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketCardHeader: React.FC<TicketCardHeaderProps> = ({
  ticket,
  resolvedColors: c,
  onOverflowPress,
  style,
}) => {
  const creatorName = ticket.createdBy?.name ?? 'Unknown';
  const avatarColor = PRIORITY_AVATAR_COLORS[ticket.priority] ?? Palette.zinc500;
  const initials = getInitials(creatorName);
  const relativeTime = formatRelativeTime(ticket.createdAt);

  return (
    <View style={[styles.container, style]}>
      {/* Creator avatar — initials, colored by priority */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: `${avatarColor}15` },
        ]}
        accessibilityRole="image"
        accessibilityLabel={`${creatorName} avatar`}
      >
        <Text style={[styles.avatarText, { color: avatarColor }]}>
          {initials}
        </Text>
      </View>

      {/* Creator name + timestamp (Stacked) */}
      <View style={styles.nameBlock}>
        <Text
          style={[styles.creatorName, { color: c.text.primary }]}
          numberOfLines={1}
        >
          {creatorName}
        </Text>
        <View style={styles.metaInfo}>
          <Text style={[styles.timestamp, { color: c.text.muted }]}>
            {relativeTime}
          </Text>
          {ticket.application?.name && (
            <>
              <Text style={[styles.dot, { color: c.text.muted }]}>•</Text>
              <Text style={[styles.appName, { color: c.text.muted }]} numberOfLines={1}>
                {ticket.application.name}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Three-dot overflow menu trigger */}
      <Pressable
        onPress={onOverflowPress}
        accessibilityRole="button"
        accessibilityLabel="More options"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }: { pressed: boolean }) => [
          styles.overflowButton,
          {
            backgroundColor: pressed ? c.surface.elevated : 'transparent',
          },
        ]}
      >
        <Ionicons
          name="ellipsis-horizontal"
          size={20}
          color={c.text.secondary}
        />
      </Pressable>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  nameBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  creatorName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    lineHeight: 18,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  dot: {
    fontSize: FontSize.xs,
  },
  appName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  overflowButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default TicketCardHeader;
