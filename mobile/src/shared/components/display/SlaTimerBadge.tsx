/**
 * SlaTimerBadge — live SLA countdown/elapsed chip.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. TicketCard.tsx — badge row chip showing SLA time remaining or overdue
 * 2. TicketDetailScreen.tsx — header area SLA indicator
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BEHAVIOR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - Uses `computeSlaState(ticket, now)` to derive display text and color
 * - Updates every 60 seconds via `setInterval` for live countdown
 * - Returns null when no `slaDeadline` is set on the ticket
 * - Color tokens: 'error' → red, 'warning' → amber, 'success' → green
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * // In a ticket card badge row
 * {ticket.slaDeadline && (
 *   <SlaTimerBadge
 *     slaDeadline={ticket.slaDeadline}
 *     status={ticket.status}
 *     resolvedColors={c}
 *   />
 * )}
 *
 * // Compact size
 * <SlaTimerBadge
 *   slaDeadline={ticket.slaDeadline}
 *   status={ticket.status}
 *   resolvedColors={c}
 *   size="sm"
 * />
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import { computeSlaState } from '@/src/features/tickets/utils/slaUtils';
import type { ThemeColors } from '@/src/constants/tokens';
import type { TicketStatus } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface SlaTimerBadgeProps {
  /** ISO date string for the SLA deadline. */
  slaDeadline: string;
  /** Current ticket status — used to determine if SLA is still active. */
  status: TicketStatus;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** 'sm' = compact chip, 'md' = standard chip. @default 'md' */
  size?: 'sm' | 'md';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const SlaTimerBadge: React.FC<SlaTimerBadgeProps> = ({
  slaDeadline,
  status,
  resolvedColors: c,
  size = 'md',
}) => {
  const [now, setNow] = useState(() => new Date());

  // Update every 60 seconds for live countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const slaState = computeSlaState({ slaDeadline, status }, now);

  // No deadline set — render nothing
  if (!slaState.displayText) return null;

  // Resolve color from token
  const accentColor =
    slaState.colorToken === 'error'
      ? c.intent.error
      : slaState.colorToken === 'warning'
      ? c.intent.warning
      : c.intent.success;

  const isSmall = size === 'sm';
  const iconSize = isSmall ? 10 : 12;
  const fontSize = isSmall ? FontSize.xs : FontSize.sm;
  const paddingH = isSmall ? 6 : 8;
  const paddingV = isSmall ? 2 : 3;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`SLA: ${slaState.displayText}`}
      style={[
        styles.container,
        {
          backgroundColor: `${accentColor}18`,
          borderColor: `${accentColor}55`,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        },
      ]}
    >
      <Ionicons
        name={slaState.isOverdue ? 'warning-outline' : 'time-outline'}
        size={iconSize}
        color={accentColor}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: accentColor, fontSize }]}>
        {slaState.displayText}
      </Text>
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
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginEnd: 3,
  },
  text: {
    fontWeight: FontWeight.semibold,
  },
});

export default SlaTimerBadge;
