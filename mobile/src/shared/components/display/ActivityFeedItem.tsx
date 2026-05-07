/**
 * ActivityFeedItem — single activity item in the real-time activity feed.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. ActivityFeedPanel.tsx — FlatList of activity items in the Dashboard
 * 2. ActivityTab.tsx       — Timeline list in the Ticket Detail screen
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────────────────╮
 * │ ▌  [🎫]  New ticket: Login crash                          ● (unread) │
 * │     Created by Mohamed • 19m ago                                     │
 * │     [HIGH] [OPEN]                                                    │
 * ╰──────────────────────────────────────────────────────────────────────╯
 *
 * - 4px left accent bar (colored by type, visible for unread items)
 * - Colored circular avatar with type-specific Ionicons icon
 * - Primary text: type-specific message
 * - Secondary text: actor + relative timestamp
 * - Chips row: priority + status chips (when ticket data present)
 * - Pulsing dot for unread items
 * - Read items rendered at 0.7 opacity
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * <ActivityFeedItem
 *   activity={item}
 *   resolvedColors={c}
 *   onPress={(activity) => navigateToTicket(activity.data.ticket?.id)}
 *   onMarkRead={(id) => markRead(id)}
 *   onMarkUnread={(id) => markUnread(id)}
 * />
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
import { Radius, FontSize, FontWeight, Spacing, Palette } from '@/src/constants/tokens';
import { ACTIVITY_TYPE_CONFIG } from '@/src/features/dashboard/utils/activityConfig';
import type { ThemeColors } from '@/src/constants/tokens';
import type { ActivityItem } from '@/src/services/api/types/notification';

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

/**
 * Returns the primary and secondary display text for an activity item.
 */
function getActivityMessage(activity: ActivityItem): {
  primary: string;
  secondary: string;
} {
  const { type, data } = activity;
  const ticketTitle = data.ticket?.title ?? 'a ticket';
  const actor =
    data.createdBy ??
    data.updatedBy ??
    data.assignedTo ??
    data.commentBy ??
    data.mentionedBy ??
    'Someone';
  const relTime = formatRelativeTime(activity.timestamp);
  const secondaryBase = `${actor} • ${relTime}`;

  switch (type) {
    case 'TICKET_CREATED':
      return {
        primary: `New ticket: ${ticketTitle}`,
        secondary: `Created by ${actor} • ${relTime}`,
      };
    case 'TICKET_UPDATED':
      return {
        primary: `Ticket updated: ${ticketTitle}`,
        secondary: `Updated by ${actor} • ${relTime}`,
      };
    case 'TICKET_ASSIGNED':
      return {
        primary: `Ticket assigned: ${ticketTitle}`,
        secondary: `Assigned to ${data.assignedTo ?? 'someone'} • ${relTime}`,
      };
    case 'COMMENT_ADDED':
      return {
        primary: `New comment on: ${ticketTitle}`,
        secondary: `${secondaryBase}`,
      };
    case 'COMMENT_DELETED':
      return {
        primary: `Comment deleted on: ${ticketTitle}`,
        secondary: `${secondaryBase}`,
      };
    case 'COMMENT_MENTION':
      return {
        primary: `You were mentioned in: ${ticketTitle}`,
        secondary: `Mentioned by ${data.mentionedBy ?? actor} • ${relTime}`,
      };
    case 'STATUS_CHANGED':
      return {
        primary: `Status changed: ${ticketTitle}`,
        secondary: data.newStatus
          ? `→ ${data.newStatus.replace(/_/g, ' ')} • ${relTime}`
          : secondaryBase,
      };
    case 'TICKET_DUE_SOON':
      return {
        primary: `Due soon: ${ticketTitle}`,
        secondary: secondaryBase,
      };
    case 'TICKET_OVERDUE':
      return {
        primary: `Overdue: ${ticketTitle}`,
        secondary: secondaryBase,
      };
    case 'PRIORITY_ESCALATED':
      return {
        primary: `Priority escalated: ${ticketTitle}`,
        secondary: secondaryBase,
      };
    case 'EPIC_FEATURE_STATUS_CHANGED':
      return {
        primary: data.description ?? `Epic/Feature updated`,
        secondary: secondaryBase,
      };
    default:
      return {
        primary: data.description ?? 'Activity',
        secondary: secondaryBase,
      };
  }
}

// Priority color map (module-level — Palette constants)
const PRIORITY_COLORS: Record<string, string> = {
  LOW: Palette.emerald500,
  MEDIUM: Palette.amber500,
  HIGH: Palette.orange500,
  URGENT: Palette.red500,
};

// Status color map (module-level — Palette constants)
const STATUS_COLORS: Record<string, string> = {
  OPEN: Palette.amber500,
  IN_PROGRESS: Palette.blue500,
  PROGRAMMING: Palette.violet500,
  UNDER_DEVELOPMENT: Palette.indigo500,
  CODE_REVIEW: Palette.purple500,
  TESTING: Palette.cyan500,
  RESOLVED: Palette.emerald500,
  CLOSED: Palette.zinc500,
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface ActivityFeedItemProps {
  /** The activity item to display. */
  activity: ActivityItem;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** Called when the item is pressed. */
  onPress: (activity: ActivityItem) => void;
  /** Called to mark the item as read. */
  onMarkRead: (id: string) => void;
  /** Called to mark the item as unread. */
  onMarkUnread: (id: string) => void;
  /** Shows a skeleton loading state. */
  isLoading?: boolean;
  /** Extra style merged onto the root container. */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pulsing dot sub-component
// ─────────────────────────────────────────────────────────────────────────────

const PulsingDot: React.FC<{ color: string }> = ({ color }) => (
  <View style={[styles.pulsingDot, { backgroundColor: color }]} />
);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  activity,
  resolvedColors: c,
  onPress,
  onMarkRead,
  onMarkUnread,
  isLoading = false,
  style,
}) => {
  const config = ACTIVITY_TYPE_CONFIG[activity.type];
  const accentColor = config?.color ?? Palette.zinc500;
  const iconName = (config?.icon ?? 'notifications-outline') as any;
  const isUnread = !activity.read;

  const { primary, secondary } = getActivityMessage(activity);
  const ticket = activity.data.ticket;

  const handlePress = () => {
    if (ticket?.id) {
      onPress(activity);
      if (isUnread) onMarkRead(activity.id);
    }
  };

  const handleLongPress = () => {
    if (isUnread) {
      onMarkRead(activity.id);
    } else {
      onMarkUnread(activity.id);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: c.surface.card, borderColor: c.border.primary },
          style,
        ]}
      >
        <View style={[styles.skeletonAvatar, { backgroundColor: c.surface.elevated }]} />
        <View style={styles.skeletonContent}>
          <View style={[styles.skeletonLine, { backgroundColor: c.surface.elevated, width: '70%' }]} />
          <View style={[styles.skeletonLine, { backgroundColor: c.surface.elevated, width: '45%' }]} />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      accessibilityRole="button"
      accessibilityLabel={primary}
      accessibilityHint={ticket?.id ? 'Tap to view ticket' : undefined}
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        {
          backgroundColor: pressed ? c.interactive.pressed : c.surface.card,
          borderColor: c.border.primary,
          opacity: isUnread ? 1 : 0.7,
        },
        style,
      ]}
    >
      {/* 4px left accent bar — visible for unread items */}
      {isUnread && (
        <View
          style={[styles.accentBar, { backgroundColor: accentColor }]}
        />
      )}

      {/* Colored avatar with type icon */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: `${accentColor}22` },
        ]}
      >
        <Ionicons name={iconName} size={16} color={accentColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Primary text row with unread dot */}
        <View style={styles.primaryRow}>
          <Text
            style={[
              styles.primaryText,
              {
                color: c.text.primary,
                fontWeight: isUnread ? FontWeight.semibold : FontWeight.normal,
              },
            ]}
            numberOfLines={2}
          >
            {primary}
          </Text>
          {isUnread && <PulsingDot color={accentColor} />}
        </View>

        {/* Secondary text */}
        <Text
          style={[styles.secondaryText, { color: c.text.secondary }]}
          numberOfLines={1}
        >
          {secondary}
        </Text>

        {/* Chips row — priority + status when ticket data present */}
        {ticket && (ticket.priority || ticket.status) && (
          <View style={styles.chipsRow}>
            {ticket.priority && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${PRIORITY_COLORS[ticket.priority] ?? Palette.zinc500}18`,
                    borderColor: `${PRIORITY_COLORS[ticket.priority] ?? Palette.zinc500}44`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: PRIORITY_COLORS[ticket.priority] ?? Palette.zinc500 },
                  ]}
                >
                  {ticket.priority}
                </Text>
              </View>
            )}
            {ticket.status && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${STATUS_COLORS[ticket.status] ?? Palette.zinc500}18`,
                    borderColor: `${STATUS_COLORS[ticket.status] ?? Palette.zinc500}44`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: STATUS_COLORS[ticket.status] ?? Palette.zinc500 },
                  ]}
                >
                  {ticket.status.replace(/_/g, ' ')}
                </Text>
              </View>
            )}
            {activity.type === 'COMMENT_MENTION' && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${Palette.violet500}18`,
                    borderColor: `${Palette.violet500}44`,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: Palette.violet500 }]}>
                  @mentioned you
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 10,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    start: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderStartStartRadius: Radius.lg,
    borderEndStartRadius: Radius.lg,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginStart: 4, // offset for accent bar
  },
  content: {
    flex: 1,
    gap: 3,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  secondaryText: {
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },
  // Skeleton styles
  skeletonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    flexShrink: 0,
  },
  skeletonContent: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});

export default ActivityFeedItem;
