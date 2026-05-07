/**
 * useDashboard — React Query hook for the Dashboard screen.
 *
 * - Fetches the full ticket list via React Query.
 * - Manages filter state: search (debounced 400ms), status, priority,
 *   userId, customerId, applicationId, overdue toggle, deleted toggle.
 * - Derives `computedStats` from the filtered ticket list.
 * - Manages bulk selection state (admin only).
 * - Exposes view mode toggle (feed / grid / compact).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/api';
import { ticketsApi } from '@/src/features/tickets/api/tickets';
import { computeStats, filterTickets } from '@/src/features/dashboard/utils/computeStats';
import { useAuthStore } from '@/src/stores/authStore';
import { Role } from '@/src/constants/roles';
import type { TicketStatus } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ViewMode = 'feed' | 'grid' | 'compact';

export interface DashboardFilters {
  search:        string;
  status:        string;
  priority:      string;
  userId:        string;
  customerId:    string;
  applicationId: string;
  overdue:       boolean;
  deleted:       boolean;
}

const DEFAULT_FILTERS: DashboardFilters = {
  search:        '',
  status:        '',
  priority:      '',
  userId:        '',
  customerId:    '',
  applicationId: '',
  overdue:       false,
  deleted:       false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useDashboard() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const tenantSuspended = useAuthStore((s) => s.tenantSuspended);

  const isAdmin      = currentUser?.role === Role.TENANT_ADMIN;
  const isEmployee   = currentUser?.role === Role.EMPLOYEE;
  const isProgrammer = currentUser?.role === Role.PROGRAMMER;

  // ── Filter state ───────────────────────────────────────────────────────────

  const [filters,     setFilters]     = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode,    setViewMode]    = useState<ViewMode>('feed');

  // ── Bulk selection (admin only) ────────────────────────────────────────────

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Debounce search 400ms ──────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // ── React Query — ticket list ──────────────────────────────────────────────

  const {
    data: allTickets = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.TICKETS.all,
    queryFn: () => ticketsApi.getTickets(),
    staleTime: 30_000,
  });

  // ── Derived: filtered tickets ──────────────────────────────────────────────

  const filteredTickets = useMemo(() => {
    return filterTickets(allTickets, {
      search:        debouncedSearch,
      status:        filters.status   || undefined,
      priority:      filters.priority || undefined,
      userId:        filters.userId   || undefined,
      customerId:    filters.customerId    || undefined,
      applicationId: filters.applicationId || undefined,
      overdue:       filters.overdue  || undefined,
      deleted:       filters.deleted  || undefined,
    });
  }, [allTickets, debouncedSearch, filters]);

  // ── Derived: stats from filtered list ─────────────────────────────────────

  const stats = useMemo(() => computeStats(filteredTickets), [filteredTickets]);

  // ── Derived: has active filters ────────────────────────────────────────────

  const hasActiveFilters = useMemo(() => {
    return (
      !!filters.search ||
      !!filters.status ||
      !!filters.priority ||
      !!filters.userId ||
      !!filters.customerId ||
      !!filters.applicationId ||
      filters.overdue ||
      filters.deleted
    );
  }, [filters]);

  // ── Filter setters ─────────────────────────────────────────────────────────

  const setSearch        = useCallback((v: string) => setFilters((f) => ({ ...f, search: v })), []);
  const setStatus        = useCallback((v: string) => setFilters((f) => ({ ...f, status: v })), []);
  const setPriority      = useCallback((v: string) => setFilters((f) => ({ ...f, priority: v })), []);
  const setUserId        = useCallback((v: string) => setFilters((f) => ({ ...f, userId: v })), []);
  const setCustomerId    = useCallback((v: string) => setFilters((f) => ({ ...f, customerId: v })), []);
  const setApplicationId = useCallback((v: string) => setFilters((f) => ({ ...f, applicationId: v })), []);
  const toggleOverdue    = useCallback(() => setFilters((f) => ({ ...f, overdue: !f.overdue })), []);
  const toggleDeleted    = useCallback(() => setFilters((f) => ({ ...f, deleted: !f.deleted })), []);
  const clearFilters     = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // ── Bulk selection ─────────────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredTickets.map((t) => t.id)));
  }, [filteredTickets]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TicketStatus }) =>
      ticketsApi.bulkUpdate(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.all });
      clearSelection();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      ticketsApi.updateTicket(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.all });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id: string) => ticketsApi.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.all });
    },
  });

  const restoreTicketMutation = useMutation({
    mutationFn: (id: string) => ticketsApi.restoreTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.all });
    },
  });

  const takeTicketMutation = useMutation({
    mutationFn: (id: string) => ticketsApi.takeTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.all });
    },
  });

  const reassignTicketMutation = useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) =>
      ticketsApi.reassignTicket(id, assignedToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.all });
    },
  });

  const editDueDateMutation = useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) =>
      ticketsApi.updateTicket(id, { dueDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.all });
    },
  });

  return {
    // Data
    tickets: filteredTickets,
    allTickets,
    stats,
    isLoading,
    refetch,

    // Auth
    currentUser,
    isAdmin,
    isEmployee,
    isProgrammer,
    tenantSuspended,

    // Filters
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

    // View mode
    viewMode,
    setViewMode,

    // Bulk selection
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,

    // Mutations
    bulkUpdate: (ids: string[], status: TicketStatus) =>
      bulkUpdateMutation.mutateAsync({ ids, status }),
    updateStatus: (id: string, status: TicketStatus) =>
      updateStatusMutation.mutateAsync({ id, status }),
    deleteTicket: (id: string) => deleteTicketMutation.mutateAsync(id),
    restoreTicket: (id: string) => restoreTicketMutation.mutateAsync(id),
    takeTicket: (id: string) => takeTicketMutation.mutateAsync(id),
    reassignTicket: (id: string, assignedToId: string) =>
      reassignTicketMutation.mutateAsync({ id, assignedToId }),
    editDueDate: (id: string, dueDate: string) =>
      editDueDateMutation.mutateAsync({ id, dueDate }),

    isBulkUpdating: bulkUpdateMutation.isPending,
  };
}
