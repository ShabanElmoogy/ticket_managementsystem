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
import { View, Text, Pressable, StyleSheet, Image, type ViewStyle } from 'react-native';
import { Radius, FontSize, FontWeight, Spacing } from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket } from '@/src/services/api/types/ticket';
import type { Attachment } from '@/src/services/api/types/attachment';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DESCRIPTION_TRUNCATE_LENGTH = 180; // Slightly shorter for feed style

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
  /** Optional attachments to show as hero image. */
  attachments?: Attachment[];
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
  attachments = [],
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

  // Find the first image attachment to show as a hero image
  const heroImage = attachments.find((a) => a.mimeType.startsWith('image/'));

  return (
    <Pressable
      onPress={handleContentPress}
      accessibilityRole="button"
      accessibilityLabel={`View ticket: ${ticket.title}`}
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        pressed && styles.containerPressed,
        style,
      ]}
    >
      {/* Ticket title */}
      <Text
        style={[styles.title, { color: c.text.primary }]}
        numberOfLines={2}
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
              >
                See less
              </Text>
            </>
          )}
        </Text>
      )}

      {/* Hero Image support (like FB/IG) */}
      {heroImage && (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: heroImage.url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>
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
  },
  containerPressed: {
    opacity: 0.85,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  toggleLink: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
});

export default TicketCardContent;
