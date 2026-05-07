/**
 * OverviewTab — Overview tab in the Ticket Detail screen.
 *
 * Shows: description card, ticket details (people + dates), linked-to section,
 * status update panel (when canUpdateStatus), actual hours input (admin only).
 *
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { TextInputProps } from 'react-native/Libraries/Components/TextInput/TextInput';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TextInput } = require('react-native') as { TextInput: (props: TextInputProps) => React.ReactElement | null };
import { Ionicons } from '@expo/vector-icons';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import { useDirection } from '@/src/providers/DirectionProvider';
import InitialAvatar from '@/src/shared/components/display/InitialAvatar';
import type { ThemeColors } from '@/src/constants/tokens';
import type { TicketWithComments, TicketStatus } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Status color map (module-level — Palette constants)
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface OverviewTabProps {
  ticket: TicketWithComments;
  resolvedColors: ThemeColors;
  canUpdateStatus: boolean;
  onStatusChange: (status: TicketStatus) => void;
  isAdmin: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const OverviewTab: React.FC<OverviewTabProps> = ({
  ticket,
  resolvedColors: c,
  canUpdateStatus,
  onStatusChange,
  isAdmin,
}) => {
  const { isRtl } = useDirection();
  const [actualHoursInput, setActualHoursInput] = useState(
    ticket.actualHours != null ? String(ticket.actualHours) : ''
  );

  const isOverdue =
    ticket.dueDate != null &&
    new Date(ticket.dueDate) < new Date() &&
    !['RESOLVED', 'CLOSED'].includes(ticket.status);

  const allStatuses = Object.keys(STATUS_COLORS) as TicketStatus[];

  // Progress bar for estimated vs actual hours
  const showProgress =
    ticket.estimatedHours != null &&
    ticket.actualHours != null &&
    ticket.estimatedHours > 0;
  const progressPct = showProgress
    ? Math.min(100, Math.round(((ticket.actualHours ?? 0) / (ticket.estimatedHours ?? 1)) * 100))
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.surface.primary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── DESCRIPTION ─────────────────────────────────────────────────── */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: c.surface.card,
            borderColor: c.border.primary,
          },
        ]}
      >
        <SectionLabel label="DESCRIPTION" c={c} />
        <Text
          style={[
            styles.descriptionText,
            { color: c.text.primary, textAlign: isRtl ? 'right' : 'left' },
          ]}
        >
          {ticket.description || 'No description provided.'}
        </Text>
      </View>

      {/* ── TICKET DETAILS ───────────────────────────────────────────────── */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: c.surface.card,
            borderColor: c.border.primary,
          },
        ]}
      >
        <SectionLabel label="TICKET DETAILS" c={c} />

        {/* PEOPLE */}
        <SectionLabel label="PEOPLE" c={c} small />

        <DetailRow
          icon="person-outline"
          label="Created by"
          c={c}
          isRtl={isRtl}
        >
          <View style={styles.personRow}>
            <InitialAvatar name={ticket.createdBy?.name ?? '?'} size={24} />
            <Text style={[styles.valueText, { color: c.text.primary }]}>
              {ticket.createdBy?.name ?? '—'}
            </Text>
          </View>
        </DetailRow>

        <DetailRow
          icon="person-circle-outline"
          label="Assigned to"
          c={c}
          isRtl={isRtl}
        >
          <View style={styles.personRow}>
            {ticket.assignedTo ? (
              <>
                <InitialAvatar name={ticket.assignedTo.name} size={24} />
                <Text style={[styles.valueText, { color: c.text.primary }]}>
                  {ticket.assignedTo.name}
                </Text>
              </>
            ) : (
              <Text style={[styles.valueText, { color: c.text.muted }]}>Unassigned</Text>
            )}
          </View>
        </DetailRow>

        {ticket.programmer && (
          <DetailRow
            icon="code-slash-outline"
            label="Programmer"
            c={c}
            isRtl={isRtl}
          >
            <View style={styles.personRow}>
              <InitialAvatar name={ticket.programmer.name} size={24} />
              <Text style={[styles.valueText, { color: c.text.primary }]}>
                {ticket.programmer.name}
              </Text>
            </View>
          </DetailRow>
        )}

        {/* DATES & TIME */}
        <View style={styles.sectionDivider} />
        <SectionLabel label="DATES & TIME" c={c} small />

        <DetailRow icon="calendar-outline" label="Created" c={c} isRtl={isRtl}>
          <Text style={[styles.valueText, { color: c.text.primary }]}>
            {formatRelativeTime(ticket.createdAt)}
          </Text>
        </DetailRow>

        <DetailRow icon="refresh-outline" label="Updated" c={c} isRtl={isRtl}>
          <Text style={[styles.valueText, { color: c.text.primary }]}>
            {formatRelativeTime(ticket.updatedAt)}
          </Text>
        </DetailRow>

        {ticket.dueDate && (
          <DetailRow icon="time-outline" label="Due date" c={c} isRtl={isRtl}>
            <Text
              style={[
                styles.valueText,
                { color: isOverdue ? c.intent.error : c.text.primary },
              ]}
            >
              {formatDate(ticket.dueDate)}
              {isOverdue && ' (overdue)'}
            </Text>
          </DetailRow>
        )}

        {ticket.estimatedHours != null && (
          <DetailRow icon="hourglass-outline" label="Est. hours" c={c} isRtl={isRtl}>
            <Text style={[styles.valueText, { color: c.text.primary }]}>
              {ticket.estimatedHours}h
            </Text>
          </DetailRow>
        )}

        {ticket.actualHours != null && (
          <DetailRow icon="checkmark-circle-outline" label="Actual hours" c={c} isRtl={isRtl}>
            <View style={styles.hoursRow}>
              <Text style={[styles.valueText, { color: c.text.primary }]}>
                {ticket.actualHours}h
              </Text>
              {showProgress && (
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: c.border.primary },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor:
                            progressPct > 100
                              ? c.intent.error
                              : progressPct > 80
                              ? c.intent.warning
                              : c.intent.success,
                          width: `${Math.min(100, progressPct)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressLabel, { color: c.text.muted }]}>
                    {progressPct}%
                  </Text>
                </View>
              )}
            </View>
          </DetailRow>
        )}
      </View>

      {/* ── LINKED TO ────────────────────────────────────────────────────── */}
      {(ticket.customer || ticket.application) && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: c.surface.card,
              borderColor: c.border.primary,
            },
          ]}
        >
          <SectionLabel label="LINKED TO" c={c} />
          <View style={styles.chipsRow}>
            {ticket.customer && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${c.interactive.primary}18`,
                    borderColor: `${c.interactive.primary}44`,
                  },
                ]}
              >
                <Ionicons name="people-outline" size={12} color={c.interactive.primary} />
                <Text style={[styles.chipText, { color: c.interactive.primary }]}>
                  {ticket.customer.name}
                </Text>
              </View>
            )}
            {ticket.application && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: `${c.intent.info}18`,
                    borderColor: `${c.intent.info}44`,
                  },
                ]}
              >
                <Ionicons name="phone-portrait-outline" size={12} color={c.intent.info} />
                <Text style={[styles.chipText, { color: c.intent.info }]}>
                  {ticket.application.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── STATUS UPDATE ────────────────────────────────────────────────── */}
      {canUpdateStatus && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: c.surface.card,
              borderColor: c.border.primary,
            },
          ]}
        >
          <SectionLabel label="UPDATE STATUS" c={c} />
          <View style={styles.statusGrid}>
            {allStatuses.map((status) => {
              const color = STATUS_COLORS[status] ?? Palette.zinc500;
              const isActive = ticket.status === status;
              return (
                <Pressable
                  key={status}
                  onPress={() => onStatusChange(status)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set status to ${STATUS_LABELS[status]}`}
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.statusButton,
                    {
                      backgroundColor: isActive ? `${color}22` : pressed ? c.interactive.pressed : 'transparent',
                      borderColor: isActive ? color : c.border.primary,
                      borderWidth: isActive ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      { color: isActive ? color : c.text.secondary },
                    ]}
                  >
                    {STATUS_LABELS[status]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* ── ACTUAL HOURS INPUT (admin only) ─────────────────────────────── */}
      {isAdmin && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: c.surface.card,
              borderColor: c.border.primary,
            },
          ]}
        >
          <SectionLabel label="ACTUAL HOURS" c={c} />
          <View
            style={[
              styles.inputRow,
              {
                borderColor: c.border.primary,
                backgroundColor: c.surface.secondary,
              },
            ]}
          >
            <Ionicons name="time-outline" size={16} color={c.text.muted} />
            <TextInput
              value={actualHoursInput}
              onChangeText={setActualHoursInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={c.text.muted}
              style={[
                styles.hoursInput,
                {
                  color: c.text.primary,
                  textAlign: isRtl ? 'right' : 'left',
                },
              ]}
              accessibilityLabel="Actual hours input"
            />
            <Text style={[styles.hoursUnit, { color: c.text.muted }]}>hours</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{
  label: string;
  c: ThemeColors;
  small?: boolean;
}> = ({ label, c, small }) => (
  <Text
    style={[
      styles.sectionLabel,
      {
        color: c.text.secondary,
        fontSize: small ? 9 : 10,
        marginBottom: small ? 6 : 10,
        marginTop: small ? 12 : 0,
      },
    ]}
  >
    {label}
  </Text>
);

const DetailRow: React.FC<{
  icon: string;
  label: string;
  c: ThemeColors;
  isRtl: boolean;
  children?: React.ReactNode;
}> = ({ icon, label, c, isRtl, children }) => (
  <View style={[styles.detailRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
    <View style={styles.detailLabelGroup}>
      <Ionicons name={icon as any} size={14} color={c.text.muted} />
      <Text style={[styles.detailLabel, { color: c.text.secondary }]}>{label}</Text>
    </View>
    <View style={styles.detailValue}>{children}</View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  sectionLabel: {
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  descriptionText: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 8,
  },
  detailRow: {
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  detailLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 110,
    flexShrink: 0,
  },
  detailLabel: {
    fontSize: FontSize.xs,
  },
  detailValue: {
    flex: 1,
  },
  valueText: {
    fontSize: FontSize.sm,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hoursRow: {
    gap: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    width: 32,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusButton: {
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusButtonText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  hoursInput: {
    flex: 1,
    fontSize: FontSize.sm,
    paddingVertical: 0,
  },
  hoursUnit: {
    fontSize: FontSize.xs,
  },
});

export default OverviewTab;
