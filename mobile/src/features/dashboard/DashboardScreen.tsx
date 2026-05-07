/**
 * DashboardScreen — Main ticket management screen.
 *
 * Composes:
 *   - StatsCards (horizontal scroll row of stat cards)
 *   - TicketFeedFilter (search + filter bar)
 *   - TicketFeed (FlatList of TicketCard in Feed/Grid/Compact modes)
 *   - BulkActionBar (admin only, appears when tickets are selected)
 *   - ActivityFeedPanel (collapsible real-time activity feed)
 *
 * Navigation:
 *   - Pressing a ticket card → TicketDetailScreen
 *   - Create button (admin only) → TicketForm
 *
 * ✅ Uses `c.*` tokens from `useThemeColors()` — screen only.
 */

import React, { useState, useCallback } from 'react';
// @ts-ignore — stale TS types; these members exist at runtime
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { useDashboard } from './hooks/useDashboard';
import { useActivityFeed } from './hooks/useActivityFeed';
import StatsCards from './components/StatsCards';
import TicketFeedFilter from './components/TicketFeedFilter';
import TicketFeed from './components/TicketFeed';
import BulkActionBar from './components/BulkActionBar';
import TicketDetailScreen from '@/src/features/tickets/components/TicketDetailScreen';
import TicketForm from '@/src/features/tickets/components/TicketForm';
import { ticketsApi } from '@/src/features/tickets/api/tickets';
import type { Ticket, TicketStatus } from '@/src/services/api/types/ticket';
import type { ActivityItem } from '@/src/services/api/types/notification';
import type { CreateTicketData } from '@/src/services/api/types/ticket';

// Sharing availability check
let sharingAvailable = true;
if (Platform.OS !== 'web') {
  try {
    const Sharing = require('expo-sharing');
    Sharing.isAvailableAsync().then((v: boolean) => { sharingAvailable = v; }).catch(() => { });
  } catch {
    sharingAvailable = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const DashboardScreen: React.FC = () => {
  const c = useThemeColors();

  // ── Dashboard data + filter state ─────────────────────────────────────────

  const {
    tickets,
    stats,
    isLoading,
    refetch,
    currentUser,
    isAdmin,
    isEmployee,
    tenantSuspended,
    filters,
    hasActiveFilters,
    setSearch,
    setStatus,
    setPriority,
    setUserId,
    setCustomerId,
    setApplicationId,
    toggleOverdue,
    toggleDeleted,
    clearFilters,
    viewMode,
    setViewMode,
    selectedIds,
    toggleSelect,
    clearSelection,
    bulkUpdate,
    updateStatus,
    deleteTicket,
    restoreTicket,
    takeTicket,
    editDueDate,
    isBulkUpdating,
  } = useDashboard();

  // ── Activity feed state ────────────────────────────────────────────────────

  const {
    loading: activityLoading,
    searchQuery: activitySearch,
    setSearchQuery: setActivitySearch,
    panelExpanded,
    handlePanelExpand,
    handlePanelCollapse,
  } = useActivityFeed();

  // ── Navigation state ───────────────────────────────────────────────────────

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try { await refetch(); }
    finally { setIsRefreshing(false); }
  }, [refetch]);

  const handleTicketPress = useCallback((ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
  }, []);

  const handleActivityPress = useCallback((activity: ActivityItem) => {
    if (activity.data.ticket?.id) {
      setSelectedTicketId(activity.data.ticket.id);
    }
  }, []);

  const handleBulkApply = useCallback(async (status: TicketStatus) => {
    await bulkUpdate(Array.from(selectedIds), status);
  }, [bulkUpdate, selectedIds]);

  const handleCreateTicket = useCallback(async (data: CreateTicketData) => {
    await ticketsApi.createTicket(data);
    await refetch();
  }, [refetch]);

  const handlePanelToggle = useCallback(() => {
    if (panelExpanded) handlePanelCollapse();
    else handlePanelExpand();
  }, [panelExpanded, handlePanelExpand, handlePanelCollapse]);

  // ── Detail view ────────────────────────────────────────────────────────────

  if (selectedTicketId) {
    return (
      <FeatureErrorBoundary featureName="TicketDetail">
        <TicketDetailScreen
          ticketId={selectedTicketId}
          onBack={() => setSelectedTicketId(null)}
        />
      </FeatureErrorBoundary>
    );
  }

  // ── Create form (admin only) ───────────────────────────────────────────────

  if (showCreateForm && isAdmin) {
    return (
      <FeatureErrorBoundary featureName="CreateTicket">
        <TicketForm
          item={null}
          onClose={() => setShowCreateForm(false)}
          onSave={handleCreateTicket}
          submitting={false}
          mode="page"
        />
      </FeatureErrorBoundary>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────────

  return (
    <FeatureErrorBoundary featureName="Dashboard">
      <View style={[styles.safeArea, { backgroundColor: c.surface.primary }]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: c.surface.primary }} />
        <View style={[styles.container, { backgroundColor: c.surface.primary }]}>

          {/* ── Stats cards ─────────────────────────────────────────────── */}
          <StatsCards
            stats={stats}
            isLoading={isLoading}
            onCardPress={(key) => {
              // Map stat key to status filter
              const statusMap: Record<string, string> = {
                open: 'OPEN',
                inProgress: 'IN_PROGRESS',
                programming: 'PROGRAMMING',
                resolved: 'RESOLVED',
                closed: 'CLOSED',
              };
              const status = statusMap[key];
              if (status) setStatus(status === filters.status ? '' : status);
            }}
          />

          {/* ── Filter bar ──────────────────────────────────────────────── */}
          <TicketFeedFilter
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            ticketCount={tickets.length}
            viewMode={viewMode}
            isAdmin={isAdmin}
            isEmployee={isEmployee}
            isRefreshing={isRefreshing}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
            onUserChange={setUserId}
            onCustomerChange={setCustomerId}
            onApplicationChange={setApplicationId}
            onToggleOverdue={toggleOverdue}
            onToggleDeleted={toggleDeleted}
            onClearFilters={clearFilters}
            onViewModeChange={setViewMode}
            onRefresh={handleRefresh}
          />

          {/* ── Ticket feed ─────────────────────────────────────────────── */}
          <View style={styles.feedContainer}>
            <TicketFeed
              tickets={tickets}
              isLoading={isLoading}
              viewMode={viewMode}
              isAdmin={isAdmin}
              isEmployee={isEmployee}
              currentUserId={currentUser?.id ?? ''}
              tenantSuspended={tenantSuspended}
              selectedIds={selectedIds}
              sharingAvailable={sharingAvailable}
              onPress={handleTicketPress}
              onTake={(id) => takeTicket(id)}
              onStatusChange={(id, status) => updateStatus(id, status)}
              onDelete={(id) => deleteTicket(id)}
              onRestore={(id) => restoreTicket(id)}
              onReassign={(id) => {
                // Reassign handled via overflow menu — no-op here
              }}
              onEditDueDate={(id, date) => editDueDate(id, date)}
              onAssignProgrammer={(id) => {
                // Navigate to detail for programmer assignment
                setSelectedTicketId(id);
              }}
              onActivityPress={(id) => setSelectedTicketId(id)}
              onSelect={isAdmin ? toggleSelect : undefined}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </View>

          {/* ── Bulk action bar (admin, when tickets selected) ───────────── */}
          {isAdmin && selectedIds.size > 0 && (
            <BulkActionBar
              selectedCount={selectedIds.size}
              isApplying={isBulkUpdating}
              onApply={handleBulkApply}
              onDeselectAll={clearSelection}
            />
          )}

          {/* ── Create ticket FAB (admin only) ───────────────────────────── */}
          {isAdmin && (
            <Pressable
              onPress={() => setShowCreateForm(true)}
              style={({ pressed }: { pressed: boolean }) => [
                styles.fab,
                {
                  backgroundColor: pressed
                    ? c.interactive.primaryPressed
                    : c.interactive.primary,
                  shadowColor: c.shadow,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create new ticket"
            >
              <Ionicons name="add" size={28} color={c.text.inverse} />
            </Pressable>
          )}
        </View>
      </View>

    </FeatureErrorBoundary>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1
  },
  feedContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default DashboardScreen;
