/**
 * TicketCardContent — title + description content area of a social-post ticket card.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────────────────╮
 * │  Login page crashes on Safari                                        │
 * │  Users report a blank screen when navigating to /login on Safari     │
 * │  14.x. The issue appears to be related to... See more                │
 * ╰──────────────────────────────────────────────────────────────────────╯
 *
 * - Ticket title in bold (primary text)
 * - Description truncated to 200 characters with an inline "See more" toggle
 * - Pressing anywhere on the content area calls `onPress` (navigates to detail)
 * - "See more" / "See less" toggle expands/collapses the full description
 *   without navigating away
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Radius, FontSize, FontWeight, Spacing } from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DESCRIPTION_TRUNCATE_LENGTH = 200;

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCardContentProps {
  /** The ticket data. */
  ticket: Ticket;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /**
   * Called when the user presses the content area (title or description).
   * Typically navigates to the Ticket_Detail screen.
   */
  onPress: (ticket: Ticket) => void;
  /**
   * Whether the description is currently expanded (controlled from parent).
   * When provided, the component operates in controlled mode.
   * When omitted, the component manages its own expanded state.
   */
  expanded?: boolean;
  /**
   * Called when the user toggles the "See more" / "See less" button.
   * Only relevant in controlled mode (when `expanded` is provided).
   */
  onToggleExpanded?: () => void;
  /** Extra style merged onto the root container. */
  style?: ViewStyle;
  /** Optional hard line clamp for description text. */
  descriptionLines?: number;
  /** When true, hides See more/See less toggle. */
  disableToggle?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketCardContent: React.FC<TicketCardContentProps> = ({
  ticket,
  resolvedColors: c,
  onPress,
  expanded: controlledExpanded,
  onToggleExpanded,
  style,
  descriptionLines,
  disableToggle = false,
}) => {
  // Internal expanded state — used when the component is uncontrolled
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Determine whether we're in controlled or uncontrolled mode
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const description = ticket.description ?? '';
  const isTruncatable = description.length > DESCRIPTION_TRUNCATE_LENGTH;
  const displayedDescription =
    isTruncatable && !isExpanded
      ? description.slice(0, DESCRIPTION_TRUNCATE_LENGTH).trimEnd()
      : description;

  const handleToggleExpanded = useCallback(
    (e: { stopPropagation?: () => void }) => {
      // Prevent the press from bubbling up to the content area's onPress
      // (which would navigate to the detail screen)
      if (e.stopPropagation) e.stopPropagation();

      if (isControlled) {
        onToggleExpanded?.();
      } else {
        setInternalExpanded((prev) => !prev);
      }
    },
    [isControlled, onToggleExpanded]
  );

  const handleContentPress = useCallback(() => {
    onPress(ticket);
  }, [onPress, ticket]);

  return (
    <Pressable
      onPress={handleContentPress}
      accessibilityRole="button"
      accessibilityLabel={`View ticket: ${ticket.title}`}
      accessibilityHint="Double tap to open ticket details"
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        pressed && styles.containerPressed,
        style,
      ]}
    >
      {/* Ticket title */}
      <Text
        style={[styles.title, { color: c.text.primary }]}
        numberOfLines={3}
      >
        {ticket.title}
      </Text>

      {/* Description + inline "See more" toggle */}
      {description.length > 0 && (
        <Text
          style={[styles.description, { color: c.text.secondary }]}
          numberOfLines={!isExpanded ? descriptionLines : undefined}
        >
          {displayedDescription}
          {isTruncatable && !isExpanded && !disableToggle && (
            <>
              {'… '}
              <Text
                onPress={handleToggleExpanded}
                style={[styles.toggleLink, { color: c.interactive.primary }]}
                accessibilityRole="button"
                accessibilityLabel="See more"
              >
                See more
              </Text>
            </>
          )}
          {isTruncatable && isExpanded && !disableToggle && (
            <>
              {' '}
              <Text
                onPress={handleToggleExpanded}
                style={[styles.toggleLink, { color: c.interactive.primary }]}
                accessibilityRole="button"
                accessibilityLabel="See less"
              >
                See less
              </Text>
            </>
          )}
        </Text>
      )}
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  containerPressed: {
    opacity: 0.75,
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  },
  description: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  toggleLink: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});

export default TicketCardContent;
