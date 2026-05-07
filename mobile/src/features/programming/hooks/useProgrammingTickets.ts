/**
 * useProgrammingTickets — React Query hook for programming-phase tickets.
 *
 * Behavior by role:
 *   - PROGRAMMER    → fetches only tickets assigned to the current user's programmer ID
 *   - TENANT_ADMIN  → fetches all programming-phase tickets
 *
 * Exposes:
 *   - tickets          — filtered + searched list
 *   - allTickets       — raw list from API (before client-side filter)
 *   - isLoading        — query loading state
 *   - refetch          — manual refetch
 *   - search           — current search string
 *   - setSearch        — update search
 *   - statusFilter     — current status filter ('' = all)
 *   - setStatusFilter  — update status filter
 *   - selectedId       — currently selected ticket ID
 *   - setSelectedId    — update selected ticket
 *   - selectedTicket   — the full Ticket object for selectedId
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores/authStore';
import { ticketsApi } from '@/src/features/tickets/api/tickets';
import { QUERY_KEYS } from '@/src/constants/api';
import { PROGRAMMING_STATUSES } from '@/src/features/tickets/utils/slaUtils';
import type { Ticket, TicketStatus } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Status values valid for the programming screen filter */
export type ProgrammingStatusFilter = TicketStatus | '';

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useProgrammingTickets() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin     = currentUser?.role === 'TENANT_ADMIN';
  const isProgrammer = currentUser?.role === 'PROGRAMMER';

  // ── Filter state ───────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<ProgrammingStatusFilter>('');
  const [selectedId,    setSelectedId]    = useState<string | null>(null);

  // ── Query ──────────────────────────────────────────────────────────────────
  // For PROGRAMMER role: filter by their user ID (server-side)
  // For TENANT_ADMIN: fetch all programming-phase tickets
  const queryFilters = useMemo(() => {
    if (isProgrammer && currentUser?.id) {
      return { userId: currentUser.id };
    }
    return {};
  }, [isProgrammer, currentUser?.id]);

  const {
    data: allTickets = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [...QUERY_KEYS.TICKETS.all, 'programming', queryFilters],
    queryFn:  () => ticketsApi.getTickets(queryFilters),
    enabled:  isAdmin || isProgrammer,
    staleTime: 30_000,
    select: (data: Ticket[]) =>
      // Always filter to programming-phase statuses client-side
      data.filter((t) => (PROGRAMMING_STATUSES as readonly string[]).includes(t.status)),
  });

  // ── Client-side filtering ──────────────────────────────────────────────────
  const tickets = useMemo(() => {
    let result = allTickets;

    // Status filter
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Search filter (title, description, customer name, application name)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.customer?.name?.toLowerCase().includes(q) ||
          t.application?.name?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [allTickets, statusFilter, search]);

  // ── Selected ticket ────────────────────────────────────────────────────────
  const selectedTicket = useMemo(
    () => (selectedId ? tickets.find((t) => t.id === selectedId) ?? null : null),
    [tickets, selectedId],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return {
    tickets,
    allTickets,
    isLoading,
    refetch,

    // Filter state
    search,
    setSearch,
    statusFilter,
    setStatusFilter,

    // Selection state
    selectedId,
    setSelectedId,
    selectedTicket,

    // Role flags
    isAdmin,
    isProgrammer,
  };
}
