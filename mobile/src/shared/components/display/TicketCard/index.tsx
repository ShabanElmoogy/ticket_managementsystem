/**
 * TicketCard — root social-post style ticket card component.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT (Feed mode)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────────────────╮
 * │  [JD] John Doe                                          2h ago  [⋮] │  ← TicketCardHeader
 * │  [OPEN] [HIGH] [OVERDUE ●] [⏱ 2h left] [📧 Email] [Acme Corp]     │  ← TicketCardBadgeRow
 * │                                                                      │
 * │  Login page crashes on Safari                                        │  ← TicketCardContent
 * │  Users report a blank screen when navigating to /login...  See more │
 * │                                                                      │
 * │  📅 Dec 15, 2024   [JD] Jane Doe   ⏱ 4h                           │  ← TicketCardMeta
 * │──────────────────────────────────────────────────────────────────────│
 * │  💬 3   📊 Activity   📤 Share   ✅ Take   [⋮]                     │  ← TicketCardActionBar
 * │──────────────────────────────────────────────────────────────────────│
 * │  [inline comments when expanded]                                     │  ← TicketCardComments
 * ╰──────────────────────────────────────────────────────────────────────╯
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VIEW MODES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - `feed`    — Full social-post layout (default). Share + inline comments shown.
 * - `grid`    — 2-column compact card. No share, no inline comments.
 * - `compact` — Dense single-line row. No share, no inline comments.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. DashboardScreen — TicketFeed (Feed/Grid/Compact modes)
 * 2. TicketsScreen   — AdminCrudScreen row renderer (Feed mode)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, FontSize, FontWeight } from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket, TicketStatus } from '@/src/services/api/types/ticket';

import TicketCardHeader      from './TicketCardHeader';
import TicketCardBadgeRow    from './TicketCardBadgeRow';
import TicketCardContent     from './TicketCardContent';
import TicketCardMeta        from './TicketCardMeta';
import TicketCardActionBar   from './TicketCardActionBar';
import TicketCardComments    from './TicketCardComments';
import TicketCardOverflowMenu from './TicketCardOverflowMenu';

const STATUS_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  OPEN: 'radio-button-on-outline',
  IN_PROGRESS: 'sync-outline',
  PROGRAMMING: 'code-slash-outline',
  UNDER_DEVELOPMENT: 'hammer-outline',
  CODE_REVIEW: 'git-compare-outline',
  TESTING: 'flask-outline',
  RESOLVED: 'checkmark-circle-outline',
  CLOSED: 'lock-closed-outline',
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCardProps {
  /** The ticket data to display. */
  ticket: Ticket;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /**
   * View mode controls the card layout density.
   * - `feed`    — Full social-post layout with share + inline comments.
   * - `grid`    — 2-column compact card.
   * - `compact` — Dense single-line row.
   */
  viewMode: 'feed' | 'grid' | 'compact';
  /** Whether this card is selected for bulk operations. */
  isSelected?: boolean;
  /** Called when the bulk-select checkbox is toggled. */
  onSelect?: (id: string) => void;
  /** Called when the card content area is pressed (navigate to detail). */
  onPress: (ticket: Ticket) => void;
  /** Called when the Share button is pressed (feed mode only). */
  onShare?: (ticket: Ticket) => void;
  /** Called when the Take button is pressed (EMPLOYEE + unassigned only). */
  onTake?: (id: string) => void;
  /** Called when a status update is selected from the overflow menu. */
  onStatusChange?: (id: string, status: TicketStatus) => void;
  /** Called when "Delete Ticket" is confirmed from the overflow menu. */
  onDelete?: (id: string) => void;
  /** Called when "Restore Ticket" is pressed from the overflow menu. */
  onRestore?: (id: string) => void;
  /** Called when "Reassign Ticket" is selected from the overflow menu. */
  onReassign?: (id: string) => void;
  /** Called when "Edit Due Date" is selected from the overflow menu. */
  onEditDueDate?: (id: string, date: string) => void;
  /** Called when "Send to Programmer" / "Reassign Programmer" is selected. */
  onAssignProgrammer?: (id: string) => void;
  /** Called when the Activity button is pressed. */
  onActivityPress?: (id: string) => void;
  /** Whether the current user can update the ticket's status. */
  canUpdateStatus: boolean;
  /** Whether the current user is a TENANT_ADMIN. */
  isAdmin: boolean;
  /** Whether the current user is an EMPLOYEE role. */
  isEmployee?: boolean;
  /** The current authenticated user's ID. */
  currentUserId: string;
  /** When true, all write actions are disabled (subscription suspended). */
  tenantSuspended?: boolean;
  /** Whether to show bulk-select checkboxes (admin only). */
  showCheckbox?: boolean;
  /**
   * List of users available for @mention suggestions in inline comments.
   * Typically the ticket's assignee + creator + watchers.
   */
  mentionUsers?: Array<{ id: string; name: string }>;
  /** Whether expo-sharing is available on this device. Defaults to true. */
  sharingAvailable?: boolean;
  /** Extra style merged onto the root card container. */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  resolvedColors: c,
  viewMode,
  isSelected = false,
  onSelect,
  onPress,
  onShare,
  onTake,
  onStatusChange,
  onDelete,
  onRestore,
  onReassign,
  onEditDueDate,
  onAssignProgrammer,
  onActivityPress,
  canUpdateStatus,
  isAdmin,
  isEmployee = false,
  currentUserId,
  tenantSuspended = false,
  mentionUsers = [],
  sharingAvailable = true,
  style,
}) => {
  // ── Local state ───────────────────────────────────────────────────────────
  /** Whether the inline comment section is expanded (feed mode only). */
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  /** Whether the description "See more" is expanded. */
  const [seeMoreExpanded, setSeeMoreExpanded] = useState(false);
  /** Whether the overflow menu bottom sheet is open. */
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);

  // ── Derived flags ─────────────────────────────────────────────────────────
  const isFeedMode    = viewMode === 'feed';
  const isCompact     = viewMode === 'compact';

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePress = useCallback(() => {
    onPress(ticket);
  }, [onPress, ticket]);

  const handleCommentPress = useCallback(() => {
    if (isFeedMode) {
      setCommentsExpanded((prev) => !prev);
    } else {
      // In grid/compact mode, navigate to detail instead
      onPress(ticket);
    }
  }, [isFeedMode, onPress, ticket]);

  const handleActivityPress = useCallback(() => {
    onActivityPress?.(ticket.id);
  }, [onActivityPress, ticket.id]);

  const handleSharePress = useCallback(() => {
    onShare?.(ticket);
  }, [onShare, ticket]);

  const handleTakePress = useCallback(() => {
    onTake?.(ticket.id);
  }, [onTake, ticket.id]);

  const handleOverflowMenuPress = useCallback(() => {
    setOverflowMenuOpen(true);
  }, []);

  const handleOverflowMenuClose = useCallback(() => {
    setOverflowMenuOpen(false);
  }, []);

  const handleViewDetails = useCallback(() => {
    onPress(ticket);
  }, [onPress, ticket]);

  const handleStatusChange = useCallback(
    (status: TicketStatus) => {
      onStatusChange?.(ticket.id, status);
    },
    [onStatusChange, ticket.id],
  );

  const handleEditDueDate = useCallback(() => {
    // onEditDueDate receives the ticket ID; the date picker is opened by the parent
    onEditDueDate?.(ticket.id, ticket.dueDate ?? '');
  }, [onEditDueDate, ticket.id, ticket.dueDate]);

  const handleReassign = useCallback(() => {
    onReassign?.(ticket.id);
  }, [onReassign, ticket.id]);

  const handleAssignProgrammer = useCallback(() => {
    onAssignProgrammer?.(ticket.id);
  }, [onAssignProgrammer, ticket.id]);

  const handleDelete = useCallback(() => {
    onDelete?.(ticket.id);
  }, [onDelete, ticket.id]);

  const handleRestore = useCallback(() => {
    onRestore?.(ticket.id);
  }, [onRestore, ticket.id]);

  const handleToggleSeeMore = useCallback(() => {
    setSeeMoreExpanded((prev) => !prev);
  }, []);

  const handleCommentAdded = useCallback(() => {
    // No-op — TicketCardComments manages its own list
    // Parent can refresh the ticket list if needed
  }, []);

  const handleCommentDeleted = useCallback(() => {
    // No-op — TicketCardComments manages its own list
  }, []);

  // ── Card border color — highlight when selected ───────────────────────────
  const cardBorderColor = isSelected
    ? c.interactive.primary
    : c.border.primary;

  // ─────────────────────────────────────────────────────────────────────────
  // Compact mode — dense single-line row
  // ─────────────────────────────────────────────────────────────────────────
  if (isCompact) {
    const statusColor = STATUS_ICON_MAP[ticket.status] ? c.interactive.primary : c.text.muted;
    const statusLabel = ticket.status.replace(/_/g, ' ');
    const priorityColor = ticket.priority === 'URGENT' ? c.intent.error
      : ticket.priority === 'HIGH' ? c.intent.warning
      : ticket.priority === 'MEDIUM' ? c.interactive.primary
      : c.intent.success;

    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }: { pressed: boolean }) => [
          styles.card,
          styles.compactCard,
          {
            backgroundColor: c.surface.card,
            borderColor: cardBorderColor,
            opacity: pressed ? 0.85 : 1,
          },
          style,
        ]}
      >
        {/* Single row: priority dot + title + status badge + overflow */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Priority dot */}
          <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: priorityColor,
            flexShrink: 0,
          }} />

          {/* Title */}
          <Text
            style={{ flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text.primary }}
            numberOfLines={1}
          >
            {ticket.title}
          </Text>

          {/* Status badge */}
          <View style={{
            paddingHorizontal: 6, paddingVertical: 2,
            borderRadius: Radius.full,
            backgroundColor: statusColor + '18',
            borderWidth: 1,
            borderColor: statusColor + '44',
            flexShrink: 0,
          }}>
            <Text style={{ fontSize: 9, fontWeight: FontWeight.bold, color: statusColor }}>
              {statusLabel}
            </Text>
          </View>

          {/* Overflow menu trigger */}
          <Pressable
            onPress={handleOverflowMenuPress}
            style={{ padding: 4 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-horizontal" size={14} color={c.text.muted} />
          </Pressable>
        </View>

        {/* Overflow menu */}
        <TicketCardOverflowMenu
          visible={overflowMenuOpen}
          onClose={handleOverflowMenuClose}
          ticket={ticket}
          resolvedColors={c}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          tenantSuspended={tenantSuspended}
          onViewDetails={handleViewDetails}
          onStatusChange={canUpdateStatus ? handleStatusChange : undefined}
          onEditDueDate={isAdmin && onEditDueDate ? handleEditDueDate : undefined}
          onReassign={isAdmin && onReassign ? handleReassign : undefined}
          onAssignProgrammer={isAdmin && onAssignProgrammer ? handleAssignProgrammer : undefined}
          onDelete={isAdmin && onDelete ? handleDelete : undefined}
          onRestore={isAdmin && onRestore ? handleRestore : undefined}
        />
      </Pressable>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Grid mode — 2-column compact card (no share, no inline comments)
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === 'grid') {
    const statusIcon = STATUS_ICON_MAP[ticket.status] ?? 'information-circle-outline';
    const statusLabel = ticket.status.replace(/_/g, ' ');

    return (
      <View
        style={[
          styles.card,
          styles.gridCard,
          {
            backgroundColor: c.surface.card,
            borderColor: cardBorderColor,
            shadowColor: c.shadow,
          },
          style,
        ]}
      >
        <View style={[styles.gridTopStrip, { borderBottomColor: c.border.primary, backgroundColor: c.surface.elevated }]}>
          <View style={[styles.gridStatusBadge, { borderColor: c.border.primary, backgroundColor: c.surface.card }]}>
            <Ionicons name={statusIcon} size={13} color={c.interactive.primary} />
          </View>
          <View style={[styles.gridStatusPill, { backgroundColor: `${c.interactive.primary}22` }]}>
            <View style={[styles.gridStatusDot, { backgroundColor: c.interactive.primary }]} />
            <Ionicons name="pricetag-outline" size={10} color={c.interactive.primary} />
          </View>
          <View style={styles.gridStatusLabelWrap}>
            <Text style={[styles.gridStatusLabel, { color: c.text.secondary }]} numberOfLines={1}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.gridBody}>
          {/* Header */}
          <TicketCardHeader
            ticket={ticket}
            resolvedColors={c}
            onOverflowPress={handleOverflowMenuPress}
          />

          {/* Badge row */}
          <TicketCardBadgeRow
            ticket={ticket}
            resolvedColors={c}
            style={styles.badgeRow}
          />

          {/* Content */}
          <TicketCardContent
            ticket={ticket}
            resolvedColors={c}
            onPress={handlePress}
            expanded={false}
            disableToggle
            descriptionLines={3}
          />
        </View>

        <View style={styles.gridBottom}>
          {/* Meta */}
          <TicketCardMeta
            ticket={ticket}
            resolvedColors={c}
            style={styles.metaRow}
          />

          {/* Action bar — no Share (onSharePress omitted), no inline comments */}
          <TicketCardActionBar
            ticket={ticket}
            resolvedColors={c}
            onCommentPress={handleCommentPress}
            onActivityPress={handleActivityPress}
            // onSharePress intentionally omitted — grid mode hides Share
            sharingAvailable={false}
            onTakePress={onTake ? handleTakePress : undefined}
            onViewDetails={handleViewDetails}
            onStatusChange={canUpdateStatus ? handleStatusChange : undefined}
            onEditDueDate={isAdmin && onEditDueDate ? handleEditDueDate : undefined}
            onReassign={isAdmin && onReassign ? handleReassign : undefined}
            onAssignProgrammer={isAdmin && onAssignProgrammer ? handleAssignProgrammer : undefined}
            onDelete={isAdmin && onDelete ? handleDelete : undefined}
            onRestore={isAdmin && onRestore ? handleRestore : undefined}
            onOverflowMenuPress={handleOverflowMenuPress}
            isAdmin={isAdmin}
            isEmployee={isEmployee}
            currentUserId={currentUserId}
            tenantSuspended={tenantSuspended}
          />
        </View>

        {/* Overflow menu */}
        <TicketCardOverflowMenu
          visible={overflowMenuOpen}
          onClose={handleOverflowMenuClose}
          ticket={ticket}
          resolvedColors={c}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          tenantSuspended={tenantSuspended}
          onViewDetails={handleViewDetails}
          onStatusChange={canUpdateStatus ? handleStatusChange : undefined}
          onEditDueDate={isAdmin && onEditDueDate ? handleEditDueDate : undefined}
          onReassign={isAdmin && onReassign ? handleReassign : undefined}
          onAssignProgrammer={isAdmin && onAssignProgrammer ? handleAssignProgrammer : undefined}
          onDelete={isAdmin && onDelete ? handleDelete : undefined}
          onRestore={isAdmin && onRestore ? handleRestore : undefined}
        />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Feed mode — full social-post layout (default)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View
      style={[
        styles.card,
        styles.feedCard,
        {
          backgroundColor: c.surface.card,
          borderColor: cardBorderColor,
          shadowColor: c.shadow,
          // Highlight selected cards with a subtle left accent border
          borderStartWidth: isSelected ? 3 : 1,
          borderStartColor: isSelected ? c.interactive.primary : c.border.primary,
        },
        style,
      ]}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <TicketCardHeader
        ticket={ticket}
        resolvedColors={c}
        onOverflowPress={handleOverflowMenuPress}
        style={styles.section}
      />

      {/* ── Badge row ──────────────────────────────────────────────────── */}
      <TicketCardBadgeRow
        ticket={ticket}
        resolvedColors={c}
        style={styles.badgeRow}
      />

      {/* ── Content ────────────────────────────────────────────────────── */}
      <TicketCardContent
        ticket={ticket}
        resolvedColors={c}
        onPress={handlePress}
        expanded={seeMoreExpanded}
        onToggleExpanded={handleToggleSeeMore}
        style={styles.section}
      />

      {/* ── Meta row ───────────────────────────────────────────────────── */}
      <TicketCardMeta
        ticket={ticket}
        resolvedColors={c}
        style={styles.metaRow}
      />

      {/* ── Action bar ─────────────────────────────────────────────────── */}
      <TicketCardActionBar
        ticket={ticket}
        resolvedColors={c}
        onCommentPress={handleCommentPress}
        onActivityPress={handleActivityPress}
        onSharePress={onShare ? handleSharePress : undefined}
        sharingAvailable={sharingAvailable}
        onTakePress={onTake ? handleTakePress : undefined}
        onViewDetails={handleViewDetails}
        onStatusChange={canUpdateStatus ? handleStatusChange : undefined}
        onEditDueDate={isAdmin && onEditDueDate ? handleEditDueDate : undefined}
        onReassign={isAdmin && onReassign ? handleReassign : undefined}
        onAssignProgrammer={isAdmin && onAssignProgrammer ? handleAssignProgrammer : undefined}
        onDelete={isAdmin && onDelete ? handleDelete : undefined}
        onRestore={isAdmin && onRestore ? handleRestore : undefined}
        onOverflowMenuPress={handleOverflowMenuPress}
        isAdmin={isAdmin}
        isEmployee={isEmployee}
        currentUserId={currentUserId}
        tenantSuspended={tenantSuspended}
      />

      {/* ── Inline comments (feed mode only, when expanded) ────────────── */}
      {commentsExpanded && (
        <TicketCardComments
          ticketId={ticket.id}
          commentCount={ticket._count?.comments ?? 0}
          resolvedColors={c}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          tenantSuspended={tenantSuspended}
          mentionUsers={mentionUsers}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
          style={styles.commentsSection}
        />
      )}

      {/* ── Overflow menu bottom sheet ──────────────────────────────────── */}
      <TicketCardOverflowMenu
        visible={overflowMenuOpen}
        onClose={handleOverflowMenuClose}
        ticket={ticket}
        resolvedColors={c}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        tenantSuspended={tenantSuspended}
        onViewDetails={handleViewDetails}
        onStatusChange={canUpdateStatus ? handleStatusChange : undefined}
        onEditDueDate={isAdmin && onEditDueDate ? handleEditDueDate : undefined}
        onReassign={isAdmin && onReassign ? handleReassign : undefined}
        onAssignProgrammer={isAdmin && onAssignProgrammer ? handleAssignProgrammer : undefined}
        onDelete={isAdmin && onDelete ? handleDelete : undefined}
        onRestore={isAdmin && onRestore ? handleRestore : undefined}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Base card ──────────────────────────────────────────────────────────────
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    paddingInline : 10
  },

  // ── Feed mode ──────────────────────────────────────────────────────────────
  feedCard: {
    // Shadow values (shadowColor overridden inline with c.shadow)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    // Elevation (Android)
    elevation: 3,
  },

  // ── Grid mode ──────────────────────────────────────────────────────────────
  gridCard: {
    padding: Spacing.sm,
    gap: Spacing.xs,
    minHeight: 330,
    // Shadow values (shadowColor overridden inline with c.shadow)
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Compact mode ───────────────────────────────────────────────────────────
  compactCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  gridTopStrip: {
    minHeight: 30,
    marginHorizontal: -Spacing.sm,
    marginTop: -Spacing.sm,
    marginBottom: 4,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  gridStatusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridStatusPill: {
    marginStart: 8,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gridStatusLabelWrap: {
    marginStart: 8,
    flex: 1,
  },
  gridStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  gridBody: {
    flex: 1,
  },
  gridBottom: {
    marginTop: 'auto',
  },

  // ── Section spacing (feed mode) ────────────────────────────────────────────
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },

  badgeRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },

  metaRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
  },

  commentsSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
});

export default TicketCard;

