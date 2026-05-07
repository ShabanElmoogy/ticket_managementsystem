/**
 * ProgrammingDetailPanel — right panel of the Programming screen.
 *
 * Shows:
 *   - Ticket title + status/priority chips
 *   - Assign/Reassign Programmer button (TENANT_ADMIN only)
 *   - TabBar with 3 tabs: TICKET INFO / PROGRAMMING / COMMENTS
 *   - Tab content:
 *       - TICKET INFO  → inline ticket details (description, people, dates)
 *       - PROGRAMMING  → ProgrammingPanel (technical info / steps / snippets)
 *       - COMMENTS     → CommentsTab (comment list + input)
 *
 * ✅ Calls useThemeColors() internally — screen-level component, not Modal-safe.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { useDirection } from '@/src/providers/DirectionProvider';
import { useAuthStore } from '@/src/stores/authStore';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import { TabBar } from '@/src/shared/components/layout/TabBar';
import CommentsTab from '@/src/features/tickets/components/tabs/CommentsTab';
import ProgrammingPanel from './ProgrammingPanel';
import { useTicketDetail } from '@/src/features/tickets/hooks/useTicketDetail';
import InitialAvatar from '@/src/shared/components/display/InitialAvatar';
import type { Ticket } from '@/src/services/api/types/ticket';
import type { TabItem } from '@/src/shared/components/layout/TabBar';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
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

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    Palette.emerald500,
  MEDIUM: Palette.amber500,
  HIGH:   Palette.orange500,
  URGENT: Palette.red500,
};

type DetailTab = 'info' | 'programming' | 'comments';

const TABS: TabItem[] = [
  { id: 'info',        label: 'Ticket Info',  icon: 'information-circle-outline' },
  { id: 'programming', label: 'Programming',  icon: 'code-slash-outline'         },
  { id: 'comments',    label: 'Comments',     icon: 'chatbubble-outline'         },
];

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
// TicketInfoTab — inline ticket details (description, people, dates)
// ─────────────────────────────────────────────────────────────────────────────

interface TicketInfoTabProps {
  ticket: Ticket;
}

const TicketInfoTab: React.FC<TicketInfoTabProps> = ({ ticket }) => {
  const c = useThemeColors();
  const { isRtl } = useDirection();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.surface.primary }}
      contentContainerStyle={styles.infoContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Description */}
      <View style={[styles.infoCard, { backgroundColor: c.surface.card, borderColor: c.border.primary }]}>
        <Text style={[styles.sectionLabel, { color: c.text.secondary, textAlign: isRtl ? 'right' : 'left' }]}>
          DESCRIPTION
        </Text>
        <Text style={[styles.descriptionText, { color: c.text.primary, textAlign: isRtl ? 'right' : 'left' }]}>
          {ticket.description || 'No description provided.'}
        </Text>
      </View>

      {/* People */}
      <View style={[styles.infoCard, { backgroundColor: c.surface.card, borderColor: c.border.primary }]}>
        <Text style={[styles.sectionLabel, { color: c.text.secondary, textAlign: isRtl ? 'right' : 'left' }]}>
          PEOPLE
        </Text>

        {/* Created by */}
        <View style={[styles.personRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <InitialAvatar name={ticket.createdBy?.name ?? '?'} size={28} />
          <View style={styles.personInfo}>
            <Text style={[styles.personLabel, { color: c.text.muted, textAlign: isRtl ? 'right' : 'left' }]}>
              Created by
            </Text>
            <Text style={[styles.personName, { color: c.text.primary, textAlign: isRtl ? 'right' : 'left' }]}>
              {ticket.createdBy?.name ?? '—'}
            </Text>
          </View>
        </View>

        {/* Assigned to */}
        <View style={[styles.personRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <InitialAvatar
            name={ticket.assignedTo?.name ?? 'U'}
            size={28}
            color={ticket.assignedTo ? undefined : Palette.zinc400}
          />
          <View style={styles.personInfo}>
            <Text style={[styles.personLabel, { color: c.text.muted, textAlign: isRtl ? 'right' : 'left' }]}>
              Assigned to
            </Text>
            <Text style={[styles.personName, { color: c.text.primary, textAlign: isRtl ? 'right' : 'left' }]}>
              {ticket.assignedTo?.name ?? 'Unassigned'}
            </Text>
          </View>
        </View>

        {/* Programmer */}
        {ticket.programmer && (
          <View style={[styles.personRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <InitialAvatar name={ticket.programmer.name} size={28} color={Palette.violet500} />
            <View style={styles.personInfo}>
              <Text style={[styles.personLabel, { color: c.text.muted, textAlign: isRtl ? 'right' : 'left' }]}>
                Programmer
              </Text>
              <Text style={[styles.personName, { color: c.text.primary, textAlign: isRtl ? 'right' : 'left' }]}>
                {ticket.programmer.name}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Dates & Time */}
      <View style={[styles.infoCard, { backgroundColor: c.surface.card, borderColor: c.border.primary }]}>
        <Text style={[styles.sectionLabel, { color: c.text.secondary, textAlign: isRtl ? 'right' : 'left' }]}>
          DATES & TIME
        </Text>

        <View style={styles.dateGrid}>
          {/* Created */}
          <View style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: c.text.muted }]}>Created</Text>
            <Text style={[styles.dateValue, { color: c.text.primary }]}>
              {formatRelativeTime(ticket.createdAt)}
            </Text>
          </View>

          {/* Updated */}
          <View style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: c.text.muted }]}>Updated</Text>
            <Text style={[styles.dateValue, { color: c.text.primary }]}>
              {formatRelativeTime(ticket.updatedAt)}
            </Text>
          </View>

          {/* Due date */}
          {ticket.dueDate && (
            <View style={styles.dateItem}>
              <Text style={[styles.dateLabel, { color: c.text.muted }]}>Due</Text>
              <Text
                style={[
                  styles.dateValue,
                  {
                    color: new Date(ticket.dueDate) < new Date()
                      ? Palette.red500
                      : c.text.primary,
                  },
                ]}
              >
                {formatDate(ticket.dueDate)}
              </Text>
            </View>
          )}

          {/* Estimated hours */}
          {ticket.estimatedHours != null && (
            <View style={styles.dateItem}>
              <Text style={[styles.dateLabel, { color: c.text.muted }]}>Est. Hours</Text>
              <Text style={[styles.dateValue, { color: c.text.primary }]}>
                {ticket.estimatedHours}h
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Customer / Application */}
      {(ticket.customer || ticket.application) && (
        <View style={[styles.infoCard, { backgroundColor: c.surface.card, borderColor: c.border.primary }]}>
          <Text style={[styles.sectionLabel, { color: c.text.secondary, textAlign: isRtl ? 'right' : 'left' }]}>
            LINKED TO
          </Text>
          <View style={[styles.linkedRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            {ticket.customer && (
              <View style={[styles.linkedChip, { backgroundColor: `${Palette.blue500}15`, borderColor: `${Palette.blue500}44` }]}>
                <Ionicons name="people-outline" size={11} color={Palette.blue500} />
                <Text style={[styles.linkedChipText, { color: Palette.blue500 }]}>
                  {ticket.customer.name}
                </Text>
              </View>
            )}
            {ticket.application && (
              <View style={[styles.linkedChip, { backgroundColor: `${Palette.emerald500}15`, borderColor: `${Palette.emerald500}44` }]}>
                <Ionicons name="phone-portrait-outline" size={11} color={Palette.emerald500} />
                <Text style={[styles.linkedChipText, { color: Palette.emerald500 }]}>
                  {ticket.application.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ProgrammingDetailPanelProps {
  ticket:              Ticket;
  onAssignProgrammer?: () => void;
  onViewDetails?:      (ticketId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ProgrammingDetailPanel: React.FC<ProgrammingDetailPanelProps> = ({
  ticket,
  onAssignProgrammer,
  onViewDetails,
}) => {
  const c = useThemeColors();
  const { isRtl } = useDirection();
  const currentUser     = useAuthStore((s) => s.user);
  const tenantSuspended = useAuthStore((s) => s.tenantSuspended);
  const isAdmin         = currentUser?.role === 'TENANT_ADMIN';

  const [activeTab, setActiveTab] = useState<DetailTab>('info');

  // canEdit: assigned programmer or admin
  const canEdit =
    isAdmin ||
    (currentUser?.id != null && currentUser.id === ticket.programmerId);

  // Fetch comments + activities for the CommentsTab
  const {
    comments,
    addComment,
    deleteComment,
    isAddingComment,
  } = useTicketDetail(ticket.id);

  const statusColor   = STATUS_COLORS[ticket.status]   ?? Palette.zinc500;
  const priorityColor = PRIORITY_COLORS[ticket.priority] ?? Palette.zinc500;

  // Mention users for comments
  const mentionUsers = [
    ticket.createdBy  && { id: ticket.createdBy.id,  name: ticket.createdBy.name  },
    ticket.assignedTo && { id: ticket.assignedTo.id, name: ticket.assignedTo.name },
    ticket.programmer && { id: ticket.programmer.id, name: ticket.programmer.name },
  ].filter(Boolean) as { id: string; name: string }[];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: c.surface.primary }]}>

      {/* ── Ticket header ────────────────────────────────────────────────── */}
      <View
        style={[
          styles.ticketHeader,
          {
            backgroundColor: c.surface.card,
            borderBottomColor: c.border.primary,
          },
        ]}
      >
        {/* Title */}
        <Text
          style={[
            styles.ticketTitle,
            { color: c.text.primary, textAlign: isRtl ? 'right' : 'left' },
          ]}
          numberOfLines={2}
        >
          {ticket.title}
        </Text>

        {/* Chips row */}
        <View style={[styles.chipsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          {/* Ticket ID */}
          <Text style={[styles.ticketId, { color: c.text.muted }]}>
            #{ticket.id.slice(0, 8)}
          </Text>

          {/* Status chip */}
          <View
            style={[
              styles.chip,
              {
                backgroundColor: `${statusColor}22`,
                borderColor:     `${statusColor}55`,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: statusColor }]}>
              {ticket.status.replace(/_/g, ' ')}
            </Text>
          </View>

          {/* Priority chip */}
          <View
            style={[
              styles.chip,
              {
                backgroundColor: `${priorityColor}22`,
                borderColor:     `${priorityColor}55`,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: priorityColor }]}>
              {ticket.priority}
            </Text>
          </View>
        </View>

        {/* Action buttons row */}
        <View style={[styles.actionRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          {/* View Full Details button — navigates to TicketDetailScreen */}
          {onViewDetails && (
            <Pressable
              onPress={() => onViewDetails(ticket.id)}
              accessibilityRole="button"
              accessibilityLabel="View full ticket details"
              style={({ pressed }: { pressed: boolean }) => [
                styles.actionButton,
                {
                  backgroundColor: pressed
                    ? `${Palette.blue500}30`
                    : `${Palette.blue500}18`,
                  borderColor: `${Palette.blue500}55`,
                },
              ]}
            >
              <Ionicons name="open-outline" size={14} color={Palette.blue500} />
              <Text style={[styles.actionButtonText, { color: Palette.blue500 }]}>
                View Full Details
              </Text>
            </Pressable>
          )}

          {/* Assign/Reassign Programmer button — admin only */}
          {isAdmin && onAssignProgrammer && (
            <Pressable
              onPress={onAssignProgrammer}
              accessibilityRole="button"
              accessibilityLabel={ticket.programmer ? 'Reassign Programmer' : 'Assign Programmer'}
              style={({ pressed }: { pressed: boolean }) => [
                styles.actionButton,
                {
                  backgroundColor: pressed
                    ? `${Palette.violet500}30`
                    : `${Palette.violet500}18`,
                  borderColor: `${Palette.violet500}55`,
                },
              ]}
            >
              <Ionicons name="person-add-outline" size={14} color={Palette.violet500} />
              <Text style={[styles.actionButtonText, { color: Palette.violet500 }]}>
                {ticket.programmer ? 'Reassign Programmer' : 'Assign Programmer'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <TabBar
        tabs={TABS}
        active={activeTab}
        onSelect={(id) => setActiveTab(id as DetailTab)}
      />

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <View style={styles.tabContent}>
        {activeTab === 'info' && (
          <TicketInfoTab ticket={ticket} />
        )}

        {activeTab === 'programming' && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.programmingContent}
            showsVerticalScrollIndicator={false}
          >
            <ProgrammingPanel
              ticketId={ticket.id}
              canEdit={canEdit}
            />
          </ScrollView>
        )}

        {activeTab === 'comments' && (
          <CommentsTab
            ticketId={ticket.id}
            comments={comments}
            resolvedColors={c}
            currentUserId={currentUser?.id ?? ''}
            isAdmin={isAdmin}
            tenantSuspended={tenantSuspended}
            onAddComment={async (content) => { await addComment(content); }}
            onDeleteComment={deleteComment}
            isAddingComment={isAddingComment}
            mentionUsers={mentionUsers}
          />
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Ticket header
  ticketHeader: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  ticketTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  },
  chipsRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  ticketId: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  actionRow: {
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Tab content
  tabContent: {
    flex: 1,
  },

  // Ticket info tab
  infoContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 32,
  },
  infoCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  personRow: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  personInfo: {
    flex: 1,
    gap: 2,
  },
  personLabel: {
    fontSize: FontSize.xs,
  },
  personName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  dateItem: {
    minWidth: 80,
    gap: 2,
  },
  dateLabel: {
    fontSize: FontSize.xs,
  },
  dateValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  linkedRow: {
    flexWrap: 'wrap',
    gap: 6,
  },
  linkedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  linkedChipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Programming tab
  programmingContent: {
    padding: Spacing.md,
    paddingBottom: 32,
  },
});

export default ProgrammingDetailPanel;
