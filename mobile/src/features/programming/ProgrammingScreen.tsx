/**
 * ProgrammingScreen — master-detail layout for programming-phase tickets.
 *
 * Layout:
 *   - Wide screens (≥ 768px): list + detail side by side
 *   - Narrow screens (< 768px): list first, selecting a ticket slides in the detail panel
 *
 * Role guard:
 *   - Only PROGRAMMER and TENANT_ADMIN roles can access this screen
 *   - Other roles see an "Access Denied" empty state
 *
 * Empty state when no ticket selected:
 *   - code-slash-outline icon + "Select a ticket to view details"
 *
 * Follows the TicketsScreen 3-state orchestration pattern.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { useDirection } from '@/src/providers/DirectionProvider';
import { useAuthStore } from '@/src/stores/authStore';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/api';
import ProgrammingTicketList from './components/ProgrammingTicketList';
import ProgrammingDetailPanel from './components/ProgrammingDetailPanel';
import AssignProgrammerSheet from '@/src/features/tickets/components/AssignProgrammerSheet';
import TicketDetailScreen from '@/src/features/tickets/components/TicketDetailScreen';
import { useProgrammingTickets } from './hooks/useProgrammingTickets';
import type { Ticket } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Breakpoint for wide (side-by-side) layout */
const WIDE_BREAKPOINT = 768;

/** Allowed roles for this screen */
const ALLOWED_ROLES = ['PROGRAMMER', 'TENANT_ADMIN'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Access Denied state
// ─────────────────────────────────────────────────────────────────────────────

const AccessDenied: React.FC = () => {
  const c = useThemeColors();
  return (
    <View style={[styles.accessDenied, { backgroundColor: c.surface.primary }]}>
      <View style={[styles.accessDeniedIcon, { backgroundColor: `${Palette.red500}15` }]}>
        <Ionicons name="lock-closed-outline" size={40} color={Palette.red500} />
      </View>
      <Text style={[styles.accessDeniedTitle, { color: c.text.primary }]}>
        Access Denied
      </Text>
      <Text style={[styles.accessDeniedSubtitle, { color: c.text.muted }]}>
        This screen is only available to Programmers and Tenant Admins.
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// No selection empty state
// ─────────────────────────────────────────────────────────────────────────────

const NoSelectionState: React.FC = () => {
  const c = useThemeColors();
  return (
    <View style={[styles.noSelection, { backgroundColor: c.surface.primary }]}>
      <View style={[styles.noSelectionIcon, { backgroundColor: `${Palette.blue500}12` }]}>
        <Ionicons name="code-slash-outline" size={48} color={Palette.blue500} />
      </View>
      <Text style={[styles.noSelectionTitle, { color: c.text.secondary }]}>
        Select a ticket to view details
      </Text>
      <Text style={[styles.noSelectionSubtitle, { color: c.text.muted }]}>
        Choose a programming ticket from the list on the left
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const ProgrammingScreen: React.FC = () => {
  const c = useThemeColors();
  const { isRtl } = useDirection();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();

  const currentUser = useAuthStore((s) => s.user);
  const isWide      = width >= WIDE_BREAKPOINT;

  // ── Role guard ─────────────────────────────────────────────────────────────
  const hasAccess = currentUser?.role != null &&
    (ALLOWED_ROLES as readonly string[]).includes(currentUser.role);

  // ── Hook ───────────────────────────────────────────────────────────────────
  const {
    tickets,
    isLoading,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedId,
    setSelectedId,
    selectedTicket,
  } = useProgrammingTickets();

  // ── Ticket detail navigation ───────────────────────────────────────────────
  /** When set, renders TicketDetailScreen full-screen over the programming layout */
  const [ticketDetailId, setTicketDetailId] = useState<string | null>(null);

  // ── Assign programmer sheet ────────────────────────────────────────────────
  const [assignSheetTicket, setAssignSheetTicket] = useState<Ticket | null>(null);

  const handleAssignProgrammer = () => {
    if (selectedTicket) setAssignSheetTicket(selectedTicket);
  };

  const handleAssigned = () => {
    // Invalidate the ticket list and detail queries
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.all });
    if (selectedId) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.detail(selectedId) });
    }
    refetch();
  };

  // ── Narrow screen: back from detail ───────────────────────────────────────
  const handleBackFromDetail = () => setSelectedId(null);

  // ── Error handler ──────────────────────────────────────────────────────────
  const handleFeatureError = () => {
    // FeatureErrorBoundary handles display
  };

  // ── Render: access denied ──────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: c.surface.primary }]} edges={['top']}>
        <AccessDenied />
      </SafeAreaView>
    );
  }

  // ── Render: ticket detail (full-screen overlay from "View Details") ────────
  if (ticketDetailId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: c.surface.primary }]} edges={['top']}>
        <FeatureErrorBoundary featureName="TicketDetail" onError={handleFeatureError}>
          <TicketDetailScreen
            ticketId={ticketDetailId}
            onBack={() => setTicketDetailId(null)}
          />
        </FeatureErrorBoundary>
      </SafeAreaView>
    );
  }

  // ── Render: narrow screen — detail view ───────────────────────────────────
  if (!isWide && selectedId && selectedTicket) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: c.surface.primary }]} edges={['top']}>
        <FeatureErrorBoundary featureName="Programming" onError={handleFeatureError}>
          {/* Back header */}
          <View
            style={[
              styles.narrowDetailHeader,
              {
                backgroundColor: c.surface.card,
                borderBottomColor: c.border.primary,
                flexDirection: isRtl ? 'row-reverse' : 'row',
              },
            ]}
          >
            <Pressable
              onPress={handleBackFromDetail}
              accessibilityRole="button"
              accessibilityLabel="Back to ticket list"
              style={({ pressed }: { pressed: boolean }) => [
                styles.backButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name={isRtl ? 'arrow-forward-outline' : 'arrow-back-outline'}
                size={20}
                color={c.interactive.primary}
              />
              <Text style={[styles.backButtonText, { color: c.interactive.primary }]}>
                Tickets
              </Text>
            </Pressable>
          </View>

          <ProgrammingDetailPanel
            ticket={selectedTicket}
            onAssignProgrammer={
              currentUser?.role === 'TENANT_ADMIN' ? handleAssignProgrammer : undefined
            }
            onViewDetails={(id) => setTicketDetailId(id)}
          />
        </FeatureErrorBoundary>

        {/* Assign programmer sheet */}
        {assignSheetTicket && (
          <AssignProgrammerSheet
            ticketId={assignSheetTicket.id}
            currentProgrammerId={assignSheetTicket.programmerId}
            visible={!!assignSheetTicket}
            onClose={() => setAssignSheetTicket(null)}
            onAssigned={handleAssigned}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Render: wide screen — side-by-side ────────────────────────────────────
  // ── Render: narrow screen — list view ─────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.surface.primary }]} edges={['top']}>
      <View style={[styles.masterDetail, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>

        {/* ── Left panel: ticket list ──────────────────────────────────── */}
        <View style={[styles.listPanel, isWide && styles.listPanelWide]}>
          <FeatureErrorBoundary featureName="ProgrammingList" onError={handleFeatureError}>
            <ProgrammingTicketList
              tickets={tickets}
              isLoading={isLoading}
              selectedId={selectedId}
              onSelect={(ticket) => setSelectedId(ticket.id)}
              onRefresh={refetch}
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
            />
          </FeatureErrorBoundary>
        </View>

        {/* ── Right panel: detail (wide screens only) ──────────────────── */}
        {isWide && (
          <View style={styles.detailPanel}>
            <FeatureErrorBoundary featureName="ProgrammingDetail" onError={handleFeatureError}>
              {selectedTicket ? (
                <ProgrammingDetailPanel
                  ticket={selectedTicket}
                  onAssignProgrammer={
                    currentUser?.role === 'TENANT_ADMIN' ? handleAssignProgrammer : undefined
                  }
                  onViewDetails={(id) => setTicketDetailId(id)}
                />
              ) : (
                <NoSelectionState />
              )}
            </FeatureErrorBoundary>
          </View>
        )}
      </View>

      {/* Assign programmer sheet */}
      {assignSheetTicket && (
        <AssignProgrammerSheet
          ticketId={assignSheetTicket.id}
          currentProgrammerId={assignSheetTicket.programmerId}
          visible={!!assignSheetTicket}
          onClose={() => setAssignSheetTicket(null)}
          onAssigned={handleAssigned}
        />
      )}
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

  // Master-detail layout
  masterDetail: {
    flex: 1,
  },
  listPanel: {
    flex: 1,
  },
  listPanelWide: {
    flex: 0,
    width: 320,
  },
  detailPanel: {
    flex: 1,
  },

  // Narrow screen detail header
  narrowDetailHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    minHeight: 48,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingEnd: 8,
  },
  backButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // Access denied
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  accessDeniedIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  accessDeniedTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  accessDeniedSubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  // No selection
  noSelection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  noSelectionIcon: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  noSelectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  noSelectionSubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProgrammingScreen;
