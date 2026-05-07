/**
 * TicketDetailScreen — Full-screen 4-tab ticket detail view.
 *
 * Tabs: Overview | Comments (N) | Attachments (N) | Activity (N)
 * Shows ProgrammingPanel in Overview when ticket is in a programming-phase status.
 *
 * Uses custom header (not AppScreenHeader) with back, title, status/priority chips,
 * ticket ID, and watch button.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import { useThemeColors } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/authStore';
import { useDirection } from '@/src/providers/DirectionProvider';
import { isProgrammingPhase } from '@/src/features/tickets/utils/slaUtils';
import { useTicketDetail } from '@/src/features/tickets/hooks/useTicketDetail';
import OverviewTab from './tabs/OverviewTab';
import CommentsTab from './tabs/CommentsTab';
import AttachmentsTab from './tabs/AttachmentsTab';
import ActivityTab from './tabs/ActivityTab';
import type { TicketStatus } from '@/src/services/api/types/ticket';

// ProgrammingPanel — optional import with placeholder fallback
let ProgrammingPanel: any = null;
try {
  ProgrammingPanel = require('@/src/features/programming/components/ProgrammingPanel').default;
} catch {
  // Not yet implemented
}

const ProgrammingPanelPlaceholder: React.FC<{ ticketId: string; resolvedColors: any }> = ({
  resolvedColors: c,
}) => (
  <View
    style={{
      padding: 16,
      backgroundColor: c.surface.card,
      borderRadius: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: c.border.primary,
    }}
  >
    <Text style={{ color: c.text.secondary, textAlign: 'center' }}>
      Programming Panel (coming soon)
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Status / Priority color maps (module-level — Palette constants)
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

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface TicketDetailScreenProps {
  ticketId: string;
  onBack: () => void;
  onEdit?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketDetailScreen: React.FC<TicketDetailScreenProps> = ({
  ticketId,
  onBack,
}) => {
  const c = useThemeColors();
  const { isRtl } = useDirection();
  const currentUser = useAuthStore((s) => s.user);
  const tenantSuspended = useAuthStore((s) => s.tenantSuspended);

  const {
    ticket,
    comments,
    attachments,
    activities,
    isLoading,
    commentsLoading,
    attachmentsLoading,
    activitiesLoading,
    activeTab,
    setActiveTab,
    isWatching,
    toggleWatch,
    addComment,
    deleteComment,
    uploadAttachment,
    deleteAttachment,
    updateStatus,
    isAddingComment,
    isUploadingAttachment,
  } = useTicketDetail(ticketId);

  const isAdmin = currentUser?.role === 'TENANT_ADMIN';
  const canUpdateStatus =
    isAdmin ||
    (currentUser?.id === ticket?.assignedToId &&
      !isProgrammingPhase(ticket?.status ?? ''));

  const showProgrammingPanel =
    activeTab === 'overview' && ticket != null && isProgrammingPhase(ticket.status);

  const PanelComponent = ProgrammingPanel ?? ProgrammingPanelPlaceholder;

  // ── Tab definitions ──────────────────────────────────────────────────────

  const tabs = [
    { key: 'overview' as const, label: 'Overview', count: null },
    { key: 'comments' as const, label: 'Comments', count: comments.length },
    { key: 'attachments' as const, label: 'Attachments', count: attachments.length },
    { key: 'activity' as const, label: 'Activity', count: activities.length },
  ];

  // ── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: c.surface.primary }]}
        edges={['top']}
      >
        <View style={[styles.loadingContainer, { backgroundColor: c.surface.primary }]}>
          <ActivityIndicator size="large" color={c.interactive.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: c.surface.primary }]}
        edges={['top']}
      >
        <View style={[styles.loadingContainer, { backgroundColor: c.surface.primary }]}>
          <Ionicons name="ticket-outline" size={48} color={c.text.muted} />
          <Text style={[styles.notFoundText, { color: c.text.muted }]}>Ticket not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[ticket.status] ?? Palette.zinc500;
  const priorityColor = PRIORITY_COLORS[ticket.priority] ?? Palette.zinc500;

  // ── Mention users for comments ───────────────────────────────────────────
  const mentionUsers = [
    ticket.createdBy && { id: ticket.createdBy.id, name: ticket.createdBy.name },
    ticket.assignedTo && { id: ticket.assignedTo.id, name: ticket.assignedTo.name },
    ticket.programmer && { id: ticket.programmer.id, name: ticket.programmer.name },
  ].filter(Boolean) as { id: string; name: string }[];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: c.surface.primary }]}
      edges={['top']}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: c.surface.header,
            flexDirection: isRtl ? 'row-reverse' : 'row',
          },
        ]}
      >
        {/* Back button */}
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }: { pressed: boolean }) => [
            styles.headerButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons
            name={isRtl ? 'arrow-forward-outline' : 'arrow-back-outline'}
            size={22}
            color={c.text.inverse}
          />
        </Pressable>

        {/* Title + chips */}
        <View style={styles.headerCenter}>
          <Text
            style={[styles.headerTitle, { color: c.text.inverse }]}
            numberOfLines={1}
          >
            {ticket.title}
          </Text>
          <View style={styles.headerChips}>
            {/* Ticket short ID */}
            <Text style={[styles.ticketId, { color: `${c.text.inverse}99` }]}>
              #{ticket.id.slice(0, 8)}
            </Text>
            {/* Status chip */}
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: `${statusColor}33`,
                  borderColor: `${statusColor}66`,
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
                  backgroundColor: `${priorityColor}33`,
                  borderColor: `${priorityColor}66`,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: priorityColor }]}>
                {ticket.priority}
              </Text>
            </View>
          </View>
        </View>

        {/* Watch button */}
        <Pressable
          onPress={toggleWatch}
          accessibilityRole="button"
          accessibilityLabel={isWatching ? 'Unwatch ticket' : 'Watch ticket'}
          style={({ pressed }: { pressed: boolean }) => [
            styles.headerButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons
            name={isWatching ? 'eye' : 'eye-outline'}
            size={22}
            color={c.text.inverse}
          />
        </Pressable>
      </View>

      {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: c.surface.card,
            borderBottomColor: c.border.primary,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.tab,
                  isActive && {
                    borderBottomColor: c.interactive.primary,
                    borderBottomWidth: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? c.interactive.primary : c.text.secondary,
                      fontWeight: isActive ? FontWeight.semibold : FontWeight.normal,
                    },
                  ]}
                >
                  {tab.label}
                  {tab.count != null && tab.count > 0 ? ` (${tab.count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <OverviewTab
              ticket={ticket}
              resolvedColors={c}
              canUpdateStatus={canUpdateStatus}
              onStatusChange={(status: TicketStatus) => updateStatus(status)}
              isAdmin={isAdmin}
            />
            {showProgrammingPanel && (
              <View style={styles.programmingPanelWrapper}>
                <PanelComponent ticketId={ticketId} resolvedColors={c} />
              </View>
            )}
          </View>
        )}

        {activeTab === 'comments' && (
          <CommentsTab
            ticketId={ticketId}
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

        {activeTab === 'attachments' && (
          <AttachmentsTab
            ticketId={ticketId}
            attachments={attachments}
            resolvedColors={c}
            currentUserId={currentUser?.id ?? ''}
            isAdmin={isAdmin}
            onUpload={async (files) => { await uploadAttachment(files); }}
            onDelete={deleteAttachment}
            isUploading={isUploadingAttachment}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityTab
            activities={activities}
            resolvedColors={c}
            isLoading={activitiesLoading}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    fontSize: FontSize.md,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 8,
    minHeight: 64,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  headerCenter: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  headerChips: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  ticketId: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
  },
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },
  // Tab bar
  tabBar: {
    borderBottomWidth: 1,
  },
  tabBarContent: {
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: FontSize.sm,
  },
  // Content
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  programmingPanelWrapper: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
});

export default TicketDetailScreen;
