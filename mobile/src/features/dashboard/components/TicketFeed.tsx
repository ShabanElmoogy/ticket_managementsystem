/**
 * TicketFeed — FlatList of TicketCard components for the Dashboard.
 *
 * Supports Feed / Grid / Compact view modes.
 * Handles all ticket action callbacks and passes them down to TicketCard.
 *
 * ✅ Uses `c.*` tokens from `useThemeColors()` — screen only (not Modal-safe).
 */

import React, { useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import type { ListRenderItem } from 'react-native';
// @ts-ignore — keyboard-aware-scroll-view types may be stale
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { Spacing, FontSize, FontWeight } from '@/src/constants/tokens';
import TicketCard from '@/src/shared/components/display/TicketCard/index';
import type { Ticket, TicketStatus } from '@/src/services/api/types/ticket';
import type { ViewMode } from '@/src/features/dashboard/hooks/useDashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface TicketFeedProps {
  tickets:          Ticket[];
  isLoading:        boolean;
  viewMode:         ViewMode;
  isAdmin:          boolean;
  isEmployee:       boolean;
  currentUserId:    string;
  tenantSuspended:  boolean;
  selectedIds:      Set<string>;
  sharingAvailable: boolean;

  // Callbacks
  onPress:             (ticket: Ticket) => void;
  onShare?:            (ticket: Ticket) => void;
  onTake?:             (id: string) => void;
  onStatusChange?:     (id: string, status: TicketStatus) => void;
  onDelete?:           (id: string) => void;
  onRestore?:          (id: string) => void;
  onReassign?:         (id: string) => void;
  onEditDueDate?:      (id: string, date: string) => void;
  onAssignProgrammer?: (id: string) => void;
  onActivityPress?:    (id: string) => void;
  onSelect?:           (id: string) => void;
  onRefresh?:          () => void;
  isRefreshing?:       boolean;

  /** Users available for @mention in inline comments */
  mentionUsers?: Array<{ id: string; name: string }>;
  /** Called when the comment button is pressed — parent owns the modal */
  onCommentPress?: (ticket: Ticket) => void;
  /** Optional footer rendered below the list (e.g. ActivityFeedPanel) */
  listFooter?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ c: ReturnType<typeof useThemeColors> }> = ({ c }) => (
  <View style={styles.emptyState}>
    <View style={[styles.emptyIconBadge, { backgroundColor: c.surface.elevated }]}>
      <Ionicons name="ticket-outline" size={40} color={c.text.muted} />
    </View>
    <Text style={[styles.emptyTitle, { color: c.text.primary }]}>
      No tickets found
    </Text>
    <Text style={[styles.emptySubtitle, { color: c.text.muted }]}>
      Try adjusting your filters or create a new ticket
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketFeed: React.FC<TicketFeedProps> = ({
  tickets,
  isLoading,
  viewMode,
  isAdmin,
  isEmployee,
  currentUserId,
  tenantSuspended,
  selectedIds,
  sharingAvailable,
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
  onSelect,
  onRefresh,
  isRefreshing = false,
  mentionUsers = [],
  onCommentPress,
  listFooter,
}) => {
  const c = useThemeColors();

  // ── Stable selected IDs string — avoids Set identity churn ───────────────
  // Convert Set → sorted string so selectedIds changes only when content changes
  const selectedIdsKey = useMemo(
    () => Array.from(selectedIds).sort().join(','),
    [selectedIds]
  );

  // ── canUpdateStatus helper ─────────────────────────────────────────────────
  const PROGRAMMING_STATUSES = useMemo(() => [
    'PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING',
  ], []);

  const getCanUpdateStatus = useCallback((ticket: Ticket): boolean => {
    if (isAdmin) return true;
    if (ticket.assignedToId === currentUserId) {
      return !PROGRAMMING_STATUSES.includes(ticket.status);
    }
    return false;
  }, [isAdmin, currentUserId, PROGRAMMING_STATUSES]);

  // ── Render item ────────────────────────────────────────────────────────────
  const renderItem: ListRenderItem<Ticket> = useCallback(({ item }) => {
    const cardStyle = viewMode === 'grid'
      ? styles.gridCardFill
      : viewMode === 'feed'
        ? styles.feedCard
        : viewMode === 'compact'
          ? styles.compactCard
          : undefined;

    // Recompute isSelected from the stable key string
    const isSelected = selectedIdsKey.split(',').includes(item.id);

    return (
      <View style={viewMode === 'grid' ? styles.gridItem : undefined}>
        <TicketCard
          ticket={item}
          resolvedColors={c}
          viewMode={viewMode}
          isSelected={isSelected}
          onSelect={isAdmin ? onSelect : undefined}
          onPress={onPress}
          onShare={onShare}
          onTake={onTake}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onRestore={onRestore}
          onReassign={onReassign}
          onEditDueDate={onEditDueDate}
          onAssignProgrammer={onAssignProgrammer}
          onActivityPress={onActivityPress}
          onCommentPress={onCommentPress}
          canUpdateStatus={getCanUpdateStatus(item)}
          isAdmin={isAdmin}
          isEmployee={isEmployee}
          currentUserId={currentUserId}
          tenantSuspended={tenantSuspended}
          showCheckbox={isAdmin && selectedIds.size > 0}
          mentionUsers={mentionUsers}
          sharingAvailable={sharingAvailable}
          style={cardStyle}
        />
      </View>
    );
  }, [
    c, viewMode, selectedIdsKey, isAdmin, isEmployee, currentUserId, tenantSuspended,
    sharingAvailable, mentionUsers, getCanUpdateStatus, onCommentPress,
    onPress, onShare, onTake, onStatusChange, onDelete, onRestore,
    onReassign, onEditDueDate, onAssignProgrammer, onActivityPress, onSelect,
    selectedIds.size,
  ]);

  // ── Key extractor ──────────────────────────────────────────────────────────
  const keyExtractor = useCallback((item: Ticket) => item.id, []);

  // ── Loading footer — memoized so it doesn't recreate on every render ───────
  const ListFooterComponent = useMemo(() => (
    <>
      {isLoading && tickets.length > 0 && (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={c.interactive.primary} />
        </View>
      )}
      {listFooter}
    </>
  ), [isLoading, tickets.length, listFooter, c.interactive.primary]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading && tickets.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={c.interactive.primary} />
        <Text style={[styles.loadingText, { color: c.text.muted }]}>
          Loading tickets...
        </Text>
      </View>
    );
  }

  // ── Grid layout wrapper ────────────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <FlatList
        key="tickets-grid-2-cols"
        data={tickets}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.gridContent,
          tickets.length === 0 && styles.emptyContent,
        ]}
        ListEmptyComponent={<EmptyState c={c} />}
        ListFooterComponent={ListFooterComponent}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={5}
        windowSize={7}
        initialNumToRender={6}
      />
    );
  }

  // ── Feed / Compact layout ──────────────────────────────────────────────────
  return (
    <KeyboardAwareFlatList
      key={`tickets-${viewMode}-1-col`}
      data={tickets}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[
        styles.listContent,
        tickets.length === 0 && styles.emptyContent,
      ]}
      ListEmptyComponent={<EmptyState c={c} />}
      ListFooterComponent={ListFooterComponent}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={5}
      windowSize={7}
      initialNumToRender={6}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      enableOnAndroid
      extraScrollHeight={200}
      enableResetScrollToCoords={false}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: Spacing.sm,
    gap:             Spacing.sm,
  },
  gridContent: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.sm,
  },
  gridRow: {
    gap:           Spacing.sm,
    marginBottom:  Spacing.sm,
  },
  gridItem: {
    flex: 1,
    alignSelf: 'stretch',
  },
  gridCardFill: {
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
  },
  feedCard: {
    marginHorizontal: Spacing.md,
  },
  compactCard: {
    marginHorizontal: Spacing.sm,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems:      'center',
  },
  loadingContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.md,
    paddingVertical: Spacing['2xl'],
  },
  loadingText: {
    fontSize: FontSize.sm,
  },
  // Empty state
  emptyState: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    gap:            Spacing.md,
  },
  emptyIconBadge: {
    width:          80,
    height:         80,
    borderRadius:   40,
    alignItems:     'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  emptySubtitle: {
    fontSize:  FontSize.sm,
    textAlign: 'center',
    maxWidth:  260,
  },
});

export default TicketFeed;
