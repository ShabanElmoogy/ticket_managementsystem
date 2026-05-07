/**
 * TicketCardBadgeRow — horizontal scrollable chip row for a ticket card.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ← [OPEN] [HIGH] [OVERDUE ●] [⏱ 2h left] [📧 Email] [Acme Corp] [MyApp] →
 *
 * Chips rendered (in order, when applicable):
 *   1. Status chip
 *   2. Priority chip
 *   3. Overdue badge (animated pulsing — only when past due and not resolved/closed)
 *   4. SLA timer badge (SlaTimerBadge component)
 *   5. Email badge (when ticket was created from email)
 *   6. Customer chip
 *   7. Application chip
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Animated } from 'react-native/Libraries/Animated/Animated';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing, Palette } from '@/src/constants/tokens';
import SlaTimerBadge from '@/src/shared/components/display/SlaTimerBadge';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Domain color maps (module-level — Palette constants)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  OPEN:              Palette.amber500,
  IN_PROGRESS:       Palette.blue500,
  PROGRAMMING:       Palette.violet500,
  UNDER_DEVELOPMENT: Palette.indigo500,
  CODE_REVIEW:       Palette.purple500,
  TESTING:           Palette.cyan500,
  RESOLVED:          Palette.emerald500,
  CLOSED:            Palette.zinc500,
};

const STATUS_LABELS: Record<string, string> = {
  OPEN:              'Open',
  IN_PROGRESS:       'In Progress',
  PROGRAMMING:       'Programming',
  UNDER_DEVELOPMENT: 'Under Dev',
  CODE_REVIEW:       'Code Review',
  TESTING:           'Testing',
  RESOLVED:          'Resolved',
  CLOSED:            'Closed',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    Palette.emerald500,
  MEDIUM: Palette.amber500,
  HIGH:   Palette.orange500,
  URGENT: Palette.red500,
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW:    'Low',
  MEDIUM: 'Medium',
  HIGH:   'High',
  URGENT: 'Urgent',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isOverdue(ticket: Ticket): boolean {
  if (!ticket.dueDate) return false;
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return false;
  return new Date(ticket.dueDate) < new Date();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  color: string;
}

const StatusChip: React.FC<ChipProps> = ({ label, color }) => (
  <View
    style={[
      styles.chip,
      {
        backgroundColor: `${color}18`,
        borderColor: `${color}44`,
      },
    ]}
  >
    <Text style={[styles.chipText, { color }]}>{label}</Text>
  </View>
);

const OverdueBadge: React.FC<{ resolvedColors: ThemeColors }> = ({ resolvedColors: c }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.chip,
        {
          backgroundColor: `${c.intent.error}18`,
          borderColor: `${c.intent.error}44`,
          opacity,
        },
      ]}
    >
      <Ionicons name="warning-outline" size={10} color={c.intent.error} style={styles.chipIcon} />
      <Text style={[styles.chipText, { color: c.intent.error, fontWeight: FontWeight.bold }]}>
        OVERDUE
      </Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCardBadgeRowProps {
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

const TicketCardBadgeRow: React.FC<TicketCardBadgeRowProps> = ({
  ticket,
  resolvedColors: c,
  style,
}) => {
  const statusColor = STATUS_COLORS[ticket.status] ?? Palette.zinc500;
  const statusLabel = STATUS_LABELS[ticket.status] ?? ticket.status;
  const priorityColor = PRIORITY_COLORS[ticket.priority] ?? Palette.zinc500;
  const priorityLabel = PRIORITY_LABELS[ticket.priority] ?? ticket.priority;
  const ticketIsOverdue = isOverdue(ticket);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, style]}
      accessibilityRole="scrollbar"
    >
      {/* Status chip */}
      <StatusChip label={statusLabel} color={statusColor} />

      {/* Priority chip */}
      <StatusChip label={priorityLabel} color={priorityColor} />

      {/* Overdue badge — animated pulsing */}
      {ticketIsOverdue && <OverdueBadge resolvedColors={c} />}

      {/* SLA timer badge */}
      {ticket.slaDeadline && (
        <SlaTimerBadge
          slaDeadline={ticket.slaDeadline}
          status={ticket.status}
          resolvedColors={c}
          size="sm"
        />
      )}

      {/* Email badge */}
      {ticket.emailFrom && (
        <View
          style={[
            styles.chip,
            {
              backgroundColor: `${Palette.sky500}18`,
              borderColor: `${Palette.sky500}44`,
            },
          ]}
        >
          <Ionicons name="mail-outline" size={10} color={Palette.sky500} style={styles.chipIcon} />
          <Text style={[styles.chipText, { color: Palette.sky500 }]}>Email</Text>
        </View>
      )}

      {/* Customer chip */}
      {ticket.customer && (
        <View
          style={[
            styles.chip,
            {
              backgroundColor: `${Palette.teal500}18`,
              borderColor: `${Palette.teal500}44`,
            },
          ]}
        >
          <Ionicons name="people-outline" size={10} color={Palette.teal500} style={styles.chipIcon} />
          <Text style={[styles.chipText, { color: Palette.teal500 }]} numberOfLines={1}>
            {ticket.customer.name}
          </Text>
        </View>
      )}

      {/* Application chip */}
      {ticket.application && (
        <View
          style={[
            styles.chip,
            {
              backgroundColor: `${Palette.indigo500}18`,
              borderColor: `${Palette.indigo500}44`,
            },
          ]}
        >
          <Ionicons name="phone-portrait-outline" size={10} color={Palette.indigo500} style={styles.chipIcon} />
          <Text style={[styles.chipText, { color: Palette.indigo500 }]} numberOfLines={1}>
            {ticket.application.name}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingEnd: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  chipIcon: {
    marginEnd: 3,
  },
  chipText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    lineHeight: 14,
  },
});

export default TicketCardBadgeRow;
