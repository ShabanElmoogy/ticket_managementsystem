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

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Radius, Spacing } from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket, TicketStatus } from '@/src/services/api/types/ticket';

import TicketCardHeader      from './TicketCardHeader';
import TicketCardBadgeRow    from './TicketCardBadgeRow';
import TicketCardContent     from './TicketCardContent';
import TicketCardMeta        from './TicketCardMeta';
import TicketCardActionBar   from './TicketCardActionBar';
import TicketCardComments, { type TicketCardCommentsHandle } from './TicketCardComments';
import TicketCardOverflowMenu from './TicketCardOverflowMenu';
import TicketCardCompact     from './TicketCardCompact';
import TicketCardGrid        from './TicketCardGrid';

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

  /** Ref to the inline comments section — used to focus the input on open. */
  const commentsRef = useRef<TicketCardCommentsHandle>(null);

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

  // Focus the comment input whenever the comments section opens
  useEffect(() => {
    if (commentsExpanded) {
      commentsRef.current?.focusCommentInput();
    }
  }, [commentsExpanded]);

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
    return (
      <TicketCardCompact
        ticket={ticket}
        resolvedColors={c}
        onPress={handlePress}
        onOverflowMenuPress={handleOverflowMenuPress}
        overflowMenuOpen={overflowMenuOpen}
        onOverflowMenuClose={handleOverflowMenuClose}
        cardBorderColor={cardBorderColor}
        style={style}
        overflowMenuProps={{
          isAdmin,
          currentUserId,
          tenantSuspended,
          onViewDetails: handleViewDetails,
          onStatusChange: canUpdateStatus ? handleStatusChange : undefined,
          onEditDueDate: isAdmin && onEditDueDate ? handleEditDueDate : undefined,
          onReassign: isAdmin && onReassign ? handleReassign : undefined,
          onAssignProgrammer: isAdmin && onAssignProgrammer ? handleAssignProgrammer : undefined,
          onDelete: isAdmin && onDelete ? handleDelete : undefined,
          onRestore: isAdmin && onRestore ? handleRestore : undefined,
        }}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Grid mode — 2-column compact card (no share, no inline comments)
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <TicketCardGrid
        ticket={ticket}
        resolvedColors={c}
        onPress={handlePress}
        onCommentPress={handleCommentPress}
        onActivityPress={handleActivityPress}
        onOverflowMenuPress={handleOverflowMenuPress}
        overflowMenuOpen={overflowMenuOpen}
        onOverflowMenuClose={handleOverflowMenuClose}
        cardBorderColor={cardBorderColor}
        style={style}
        actionBarProps={{
          onTakePress: onTake ? handleTakePress : undefined,
          onViewDetails: handleViewDetails,
          onStatusChange: canUpdateStatus ? handleStatusChange : undefined,
          onEditDueDate: isAdmin && onEditDueDate ? handleEditDueDate : undefined,
          onReassign: isAdmin && onReassign ? handleReassign : undefined,
          onAssignProgrammer: isAdmin && onAssignProgrammer ? handleAssignProgrammer : undefined,
          onDelete: isAdmin && onDelete ? handleDelete : undefined,
          onRestore: isAdmin && onRestore ? handleRestore : undefined,
          isAdmin,
          isEmployee,
          currentUserId,
          tenantSuspended,
        }}
        overflowMenuProps={{
          isAdmin,
          currentUserId,
          tenantSuspended,
          onViewDetails: handleViewDetails,
          onStatusChange: canUpdateStatus ? handleStatusChange : undefined,
          onEditDueDate: isAdmin && onEditDueDate ? handleEditDueDate : undefined,
          onReassign: isAdmin && onReassign ? handleReassign : undefined,
          onAssignProgrammer: isAdmin && onAssignProgrammer ? handleAssignProgrammer : undefined,
          onDelete: isAdmin && onDelete ? handleDelete : undefined,
          onRestore: isAdmin && onRestore ? handleRestore : undefined,
        }}
      />
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
          ref={commentsRef}
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
    marginBottom: Spacing.md,
    paddingInline: 10,
  },

  // ── Feed mode ──────────────────────────────────────────────────────────────
  feedCard: {
    // Premium shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // ── Section spacing (feed mode) ────────────────────────────────────────────
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },

  badgeRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
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

