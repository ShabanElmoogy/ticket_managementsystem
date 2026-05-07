/**
 * TicketCardMeta — compact info row for a social-post ticket card.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────────────────╮
 * │  📅 Dec 15, 2024   [JD] Jane Doe   ⏱ 4h                            │
 * ╰──────────────────────────────────────────────────────────────────────╯
 *
 * Items rendered (in order, when applicable):
 *   1. Due date — calendar icon + formatted date (red when overdue)
 *   2. Assigned-to — initials avatar + user name (or "Unassigned" in muted)
 *   3. Estimated hours — clock icon + "{N}h"
 *
 * Items are separated by a subtle vertical divider. Items that have no data
 * are omitted entirely (e.g. no due date → due date item is hidden).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing, Palette } from '@/src/constants/tokens';
import { getInitials } from '@/src/shared/components/display/Avatar';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a date string into a short human-readable label.
 * e.g. "Dec 15, 2024"
 */
function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns true when the ticket's due date is in the past and the ticket
 * is not yet resolved or closed.
 */
function isDueDateOverdue(ticket: Ticket): boolean {
  if (!ticket.dueDate) return false;
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return false;
  return new Date(ticket.dueDate) < new Date();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Thin vertical divider between meta items. */
const MetaDivider: React.FC<{ color: string }> = ({ color }) => (
  <View style={[styles.divider, { backgroundColor: color }]} />
);

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCardMetaProps {
  /** The ticket data. */
  ticket: Ticket;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** Extra style merged onto the root container. */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketCardMeta: React.FC<TicketCardMetaProps> = ({
  ticket,
  resolvedColors: c,
  style,
}) => {
  const overdue = isDueDateOverdue(ticket);
  const dueDateColor = overdue ? c.intent.error : c.text.secondary;

  const assigneeName = ticket.assignedTo?.name ?? null;
  const assigneeInitials = assigneeName ? getInitials(assigneeName) : null;

  // Determine which items are visible so we can insert dividers correctly
  const hasDueDate = !!ticket.dueDate;
  const hasAssignee = true; // always shown — either name or "Unassigned"
  const hasEstimatedHours =
    ticket.estimatedHours !== undefined && ticket.estimatedHours !== null;

  // Build a list of visible item keys to know where to place dividers
  const visibleItems: Array<'dueDate' | 'assignee' | 'estimatedHours'> = [];
  if (hasDueDate) visibleItems.push('dueDate');
  if (hasAssignee) visibleItems.push('assignee');
  if (hasEstimatedHours) visibleItems.push('estimatedHours');

  if (visibleItems.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      {/* ── Due date ─────────────────────────────────────────────────────── */}
      {hasDueDate && (
        <>
          <View style={styles.metaItem}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={dueDateColor}
              style={styles.metaIcon}
            />
            <Text
              style={[styles.metaText, { color: dueDateColor }]}
              numberOfLines={1}
            >
              {formatDueDate(ticket.dueDate!)}
            </Text>
          </View>

          {/* Divider after due date if more items follow */}
          {(visibleItems.indexOf('dueDate') < visibleItems.length - 1) && (
            <MetaDivider color={c.border.primary} />
          )}
        </>
      )}

      {/* ── Assigned-to ──────────────────────────────────────────────────── */}
      <View style={styles.metaItem}>
        {assigneeName ? (
          <>
            {/* Initials avatar */}
            <View
              style={[
                styles.assigneeAvatar,
                { backgroundColor: `${Palette.blue500}22` },
              ]}
              accessibilityRole="image"
              accessibilityLabel={`${assigneeName} avatar`}
            >
              <Text style={[styles.assigneeInitials, { color: Palette.blue500 }]}>
                {assigneeInitials}
              </Text>
            </View>
            <Text
              style={[styles.metaText, { color: c.text.secondary }]}
              numberOfLines={1}
            >
              {assigneeName}
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name="person-outline"
              size={12}
              color={c.text.muted}
              style={styles.metaIcon}
            />
            <Text
              style={[styles.metaText, { color: c.text.muted }]}
              numberOfLines={1}
            >
              Unassigned
            </Text>
          </>
        )}
      </View>

      {/* Divider after assignee if estimated hours follow */}
      {hasEstimatedHours && (
        <MetaDivider color={c.border.primary} />
      )}

      {/* ── Estimated hours ───────────────────────────────────────────────── */}
      {hasEstimatedHours && (
        <View style={styles.metaItem}>
          <Ionicons
            name="time-outline"
            size={12}
            color={c.text.secondary}
            style={styles.metaIcon}
          />
          <Text
            style={[styles.metaText, { color: c.text.secondary }]}
            numberOfLines={1}
          >
            {ticket.estimatedHours}h
          </Text>
        </View>
      )}
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
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  metaIcon: {
    // Slight nudge to align optically with text baseline
    marginTop: 1,
  },
  metaText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
    flexShrink: 1,
  },
  divider: {
    width: 1,
    height: 12,
    borderRadius: Radius.full,
    opacity: 0.4,
    marginHorizontal: 2,
  },
  assigneeAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  assigneeInitials: {
    fontSize: 8,
    fontWeight: FontWeight.bold,
    lineHeight: 10,
  },
});

export default TicketCardMeta;
