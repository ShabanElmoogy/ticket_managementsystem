/**
 * TicketCardActionBar — full-width action row at the bottom of a social-post ticket card.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────────────────╮
 * │  💬 3   📊 Activity   📤 Share   ✅ Take   [⋮]                      │
 * ╰──────────────────────────────────────────────────────────────────────╯
 *
 * Buttons rendered (in order, when applicable):
 *   1. 💬 Comment — always shown; count badge when comments > 0
 *   2. 📊 Activity — always shown
 *   3. 📤 Share — hidden when expo-sharing is unavailable
 *   4. ✅ Take — shown only for EMPLOYEE role when ticket is unassigned
 *   5. [⋮] Three-dot overflow menu — role-gated actions:
 *        • View Details (all roles)
 *        • ─── divider ───
 *        • Mark as Open / In Progress / Resolved / Closed (canUpdateStatus)
 *        • ─── divider ───
 *        • Edit Due Date (TENANT_ADMIN only)
 *        • Reassign Ticket (TENANT_ADMIN only)
 *        • Send to Programmer / Reassign Programmer (TENANT_ADMIN only)
 *        • ─── divider ───
 *        • Delete Ticket (TENANT_ADMIN, active tickets only)
 *        • Restore Ticket (TENANT_ADMIN, deleted tickets only)
 *
 * All write actions are disabled when `tenantSuspended` is true.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withSequence,
  withTiming
} from 'react-native-reanimated';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing, Palette } from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket, TicketStatus } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Statuses that belong to the programming phase — status updates are blocked for non-admins. */
const PROGRAMMING_STATUSES: TicketStatus[] = [
  'PROGRAMMING',
  'UNDER_DEVELOPMENT',
  'CODE_REVIEW',
  'TESTING',
];

/** Status options shown in the overflow menu for status updates. */
const STATUS_UPDATE_OPTIONS: Array<{ status: TicketStatus; label: string; color: string }> = [
  { status: 'OPEN',        label: 'Mark as Open',        color: Palette.amber500  },
  { status: 'IN_PROGRESS', label: 'Mark as In Progress', color: Palette.blue500   },
  { status: 'RESOLVED',    label: 'Mark as Resolved',    color: Palette.emerald500 },
  { status: 'CLOSED',      label: 'Mark as Closed',      color: Palette.zinc500   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determines whether the current user can update the ticket's status.
 * True when: user is TENANT_ADMIN, OR (user is the assignee AND ticket is not
 * in a programming-phase status).
 */
function canUpdateTicketStatus(
  ticket: Ticket,
  isAdmin: boolean,
  currentUserId: string,
): boolean {
  if (isAdmin) return true;
  const isAssignee = ticket.assignedToId === currentUserId;
  const inProgrammingPhase = PROGRAMMING_STATUSES.includes(ticket.status);
  return isAssignee && !inProgrammingPhase;
}

/**
 * Returns true when the ticket is soft-deleted (has a deletedAt timestamp).
 */
function isDeleted(ticket: Ticket): boolean {
  return !!ticket.deletedAt;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  badgeCount?: number;
  color: string;
  resolvedColors: ThemeColors;
  active?: boolean;
}

/**
 * A single action button in the action bar — icon + label, optional count badge.
 * Styled like a social-post reaction button (FB/IG style) with Reanimated feedback.
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onPress,
  disabled = false,
  badgeCount,
  color,
  resolvedColors: c,
  active = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }: { pressed: boolean }) => [
          styles.actionButton,
          active && { backgroundColor: `${color}10` },
          { opacity: disabled ? 0.3 : 1 },
        ]}
      >
        <View style={styles.actionButtonInner}>
          <View style={[styles.iconWrapper, { backgroundColor: active ? `${color}15` : 'transparent', padding: 6, borderRadius: 12 }]}>
            <Ionicons 
              name={active ? (icon.replace('-outline', '') as any) : icon as any} 
              size={18} 
              color={active ? color : c.text.secondary} 
            />
            {badgeCount !== undefined && badgeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: Palette.red500, borderColor: c.surface.card }]}>
                <Text style={styles.badgeText}>
                  {badgeCount > 9 ? '9+' : String(badgeCount)}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.actionLabel,
              { 
                color: active ? color : c.text.secondary,
                fontWeight: active ? FontWeight.bold : FontWeight.medium
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Overflow menu item types
// ─────────────────────────────────────────────────────────────────────────────

type OverflowMenuDivider = { type: 'divider'; key: string };
type OverflowMenuItem = {
  type: 'item';
  key: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
};
type OverflowMenuEntry = OverflowMenuDivider | OverflowMenuItem;

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCardActionBarProps {
  /** The ticket data. */
  ticket: Ticket;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** Called when the Comment button is pressed. */
  onCommentPress: () => void;
  /** Called when the Activity button is pressed. */
  onActivityPress: () => void;
  /** Called when the Share button is pressed. Omit to hide the Share button. */
  onSharePress?: () => void;
  /** Whether expo-sharing is available on this device. Defaults to true. */
  sharingAvailable?: boolean;
  /** Called when the Take button is pressed (EMPLOYEE + unassigned only). */
  onTakePress?: () => void;
  /** Called when "View Details" is selected from the overflow menu. */
  onViewDetails: () => void;
  /** Called when a status update is selected from the overflow menu. */
  onStatusChange?: (status: TicketStatus) => void;
  /** Called when "Edit Due Date" is selected from the overflow menu. */
  onEditDueDate?: () => void;
  /** Called when "Reassign Ticket" is selected from the overflow menu. */
  onReassign?: () => void;
  /** Called when "Send to Programmer" / "Reassign Programmer" is selected. */
  onAssignProgrammer?: () => void;
  /** Called when "Delete Ticket" is confirmed from the overflow menu. */
  onDelete?: () => void;
  /** Called when "Restore Ticket" is pressed from the overflow menu. */
  onRestore?: () => void;
  /** Called when the three-dot overflow menu button is pressed. */
  onOverflowMenuPress: () => void;
  /** Whether the current user is a TENANT_ADMIN. */
  isAdmin: boolean;
  /** Whether the current user is an EMPLOYEE role. */
  isEmployee: boolean;
  /** The current authenticated user's ID. */
  currentUserId: string;
  /** When true, all write actions are disabled (subscription suspended). */
  tenantSuspended?: boolean;
  /** Extra style merged onto the root container. */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketCardActionBar: React.FC<TicketCardActionBarProps> = ({
  ticket,
  resolvedColors: c,
  onCommentPress,
  onActivityPress,
  onSharePress,
  sharingAvailable = true,
  onTakePress,
  onViewDetails,
  onStatusChange,
  onEditDueDate,
  onReassign,
  onAssignProgrammer,
  onDelete,
  onRestore,
  onOverflowMenuPress,
  isAdmin,
  isEmployee,
  currentUserId,
  tenantSuspended = false,
  style,
}) => {
  const commentCount = ticket._count?.comments ?? 0;
  const ticketIsDeleted = isDeleted(ticket);

  // ── Show "Take" button: EMPLOYEE role + ticket has no assignee ────────────
  const showTakeButton =
    isEmployee &&
    !ticket.assignedToId &&
    !ticketIsDeleted &&
    !tenantSuspended;

  // ── Show "Share" button: only when sharing is available ──────────────────
  const showShareButton = sharingAvailable && !!onSharePress;

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: c.border.primary },
        style,
      ]}
    >
      {/* ── Comment button ─────────────────────────────────────────────── */}
      <ActionButton
        icon="chatbubble-outline"
        label={commentCount > 0 ? String(commentCount) : 'Comment'}
        onPress={onCommentPress}
        disabled={tenantSuspended}
        color={Palette.violet500}
        resolvedColors={c}
        active={commentCount > 0}
      />

      {/* ── Activity button ────────────────────────────────────────────── */}
      <ActionButton
        icon="pulse-outline"
        label="Activity"
        onPress={onActivityPress}
        color={c.interactive.primary}
        resolvedColors={c}
      />

      {/* ── Share button ───────────────────────────────────────────────── */}
      {showShareButton && (
        <ActionButton
          icon="share-social-outline"
          label="Share"
          onPress={onSharePress!}
          color={Palette.blue500}
          resolvedColors={c}
        />
      )}

      {/* ── Take button ────────────────────────────────────────────────── */}
      {showTakeButton && (
        <ActionButton
          icon="checkmark-circle-outline"
          label="Take"
          onPress={onTakePress!}
          color={Palette.emerald500}
          resolvedColors={c}
        />
      )}

      <View style={styles.spacer} />

      {/* ── More Options ───────────────────────────────────────────────── */}
      <Pressable
        onPress={onOverflowMenuPress}
        style={styles.overflowButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={c.text.muted} />
      </Pressable>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Overflow menu builder (exported for use by TicketCardOverflowMenu)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the ordered list of overflow menu entries for a ticket card.
 * Exported so `TicketCardOverflowMenu` can consume the same logic without
 * duplicating role-gate rules.
 *
 * @param ticket - The ticket data
 * @param options - Role flags and action callbacks
 * @returns Ordered array of menu items and dividers
 */
export function buildOverflowMenuEntries(
  ticket: Ticket,
  options: {
    isAdmin: boolean;
    currentUserId: string;
    tenantSuspended: boolean;
    onViewDetails: () => void;
    onStatusChange?: (status: TicketStatus) => void;
    onEditDueDate?: () => void;
    onReassign?: () => void;
    onAssignProgrammer?: () => void;
    onDelete?: () => void;
    onRestore?: () => void;
    resolvedColors: ThemeColors;
  },
): OverflowMenuEntry[] {
  const {
    isAdmin,
    currentUserId,
    tenantSuspended,
    onViewDetails,
    onStatusChange,
    onEditDueDate,
    onReassign,
    onAssignProgrammer,
    onDelete,
    onRestore,
    resolvedColors: c,
  } = options;

  const ticketIsDeleted = isDeleted(ticket);
  const canUpdateStatus = canUpdateTicketStatus(ticket, isAdmin, currentUserId);
  const hasProgrammer = !!ticket.programmerId;

  const entries: OverflowMenuEntry[] = [];

  // ── View Details (all roles) ──────────────────────────────────────────────
  entries.push({
    type: 'item',
    key: 'view-details',
    icon: 'eye-outline',
    label: 'View Details',
    color: c.interactive.primary,
    onPress: onViewDetails,
  });

  // ── Status updates (role-gated) ───────────────────────────────────────────
  if (canUpdateStatus && onStatusChange && !ticketIsDeleted) {
    entries.push({ type: 'divider', key: 'divider-status' });

    for (const opt of STATUS_UPDATE_OPTIONS) {
      // Skip the current status — no point showing it
      if (opt.status === ticket.status) continue;
      entries.push({
        type: 'item',
        key: `status-${opt.status}`,
        icon: 'swap-horizontal-outline',
        label: opt.label,
        color: opt.color,
        onPress: () => onStatusChange(opt.status),
        disabled: tenantSuspended,
      });
    }
  }

  // ── Admin-only actions ────────────────────────────────────────────────────
  if (isAdmin && !ticketIsDeleted) {
    const hasAdminActions =
      !!onEditDueDate || !!onReassign || !!onAssignProgrammer;

    if (hasAdminActions) {
      entries.push({ type: 'divider', key: 'divider-admin' });

      if (onEditDueDate) {
        entries.push({
          type: 'item',
          key: 'edit-due-date',
          icon: 'calendar-outline',
          label: 'Edit Due Date',
          color: c.text.primary,
          onPress: onEditDueDate,
          disabled: tenantSuspended,
        });
      }

      if (onReassign) {
        entries.push({
          type: 'item',
          key: 'reassign',
          icon: 'person-outline',
          label: 'Reassign Ticket',
          color: c.text.primary,
          onPress: onReassign,
          disabled: tenantSuspended,
        });
      }

      if (onAssignProgrammer) {
        entries.push({
          type: 'item',
          key: 'assign-programmer',
          icon: 'code-slash-outline',
          label: hasProgrammer ? 'Reassign Programmer' : 'Send to Programmer',
          color: Palette.indigo500,
          onPress: onAssignProgrammer,
          disabled: tenantSuspended,
        });
      }
    }
  }

  // ── Destructive actions (admin only) ─────────────────────────────────────
  if (isAdmin) {
    const hasDestructiveActions =
      (!ticketIsDeleted && !!onDelete) || (ticketIsDeleted && !!onRestore);

    if (hasDestructiveActions) {
      entries.push({ type: 'divider', key: 'divider-destructive' });

      if (!ticketIsDeleted && onDelete) {
        entries.push({
          type: 'item',
          key: 'delete',
          icon: 'trash-outline',
          label: 'Delete Ticket',
          color: c.intent.error,
          onPress: onDelete,
          disabled: tenantSuspended,
        });
      }

      if (ticketIsDeleted && onRestore) {
        entries.push({
          type: 'item',
          key: 'restore',
          icon: 'refresh-outline',
          label: 'Restore Ticket',
          color: c.intent.success,
          onPress: onRestore,
        });
      }
    }
  }

  return entries;
}

// Re-export types for consumers (TicketCardOverflowMenu)
export type { OverflowMenuEntry, OverflowMenuItem, OverflowMenuDivider };

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.xl,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
    lineHeight: 10,
  },
  actionLabel: {
    fontSize: FontSize.xs,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  spacer: {
    flex: 1,
  },
  overflowButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TicketCardActionBar;
