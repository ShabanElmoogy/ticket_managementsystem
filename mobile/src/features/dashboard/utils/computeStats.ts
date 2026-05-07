/**
 * computeStats.ts — Pure utility functions for dashboard ticket statistics.
 *
 * No side effects, no React hooks, no API calls.
 */

import type { Ticket } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ComputedStats {
  total: number;
  open: number;
  inProgress: number;
  programming: number;
  resolved: number;
  closed: number;
}

export interface TicketFilters {
  search?: string;
  status?: string;
  priority?: string;
  userId?: string;
  customerId?: string;
  applicationId?: string;
  overdue?: boolean;
  deleted?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status groupings
// ─────────────────────────────────────────────────────────────────────────────

const PROGRAMMING_STATUSES = [
  'PROGRAMMING',
  'UNDER_DEVELOPMENT',
  'CODE_REVIEW',
  'TESTING',
] as const;

const NON_OVERDUE_STATUSES = ['RESOLVED', 'CLOSED'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// computeStats
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Counts tickets by status into a ComputedStats object.
 *
 * Status mapping:
 *   open        → 'OPEN'
 *   inProgress  → 'IN_PROGRESS'
 *   programming → 'PROGRAMMING' | 'UNDER_DEVELOPMENT' | 'CODE_REVIEW' | 'TESTING'
 *   resolved    → 'RESOLVED'
 *   closed      → 'CLOSED'
 *
 * Invariant: open + inProgress + programming + resolved + closed === total
 */
export function computeStats(tickets: Ticket[]): ComputedStats {
  const stats: ComputedStats = {
    total: tickets.length,
    open: 0,
    inProgress: 0,
    programming: 0,
    resolved: 0,
    closed: 0,
  };

  for (const ticket of tickets) {
    switch (ticket.status) {
      case 'OPEN':
        stats.open++;
        break;
      case 'IN_PROGRESS':
        stats.inProgress++;
        break;
      case 'PROGRAMMING':
      case 'UNDER_DEVELOPMENT':
      case 'CODE_REVIEW':
      case 'TESTING':
        stats.programming++;
        break;
      case 'RESOLVED':
        stats.resolved++;
        break;
      case 'CLOSED':
        stats.closed++;
        break;
      default:
        // Unknown statuses are counted in total but not in any sub-bucket.
        // This keeps the invariant: sub-buckets may not sum to total for unknown statuses.
        break;
    }
  }

  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// filterTickets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filters a ticket array by the given TicketFilters.
 *
 * Filter rules:
 *   search       — case-insensitive match against title or description
 *   status       — exact match on ticket.status
 *   priority     — exact match on ticket.priority
 *   userId       — exact match on ticket.assignedToId
 *   customerId   — exact match on ticket.customerId
 *   applicationId — exact match on ticket.applicationId
 *   overdue      — dueDate is in the past AND status is not RESOLVED or CLOSED
 *   deleted      — ticket.isDeleted flag (uses deletedAt presence as proxy)
 */
export function filterTickets(tickets: Ticket[], filters: TicketFilters): Ticket[] {
  return tickets.filter((ticket) => {
    // Search filter
    if (filters.search && filters.search.trim() !== '') {
      const query = filters.search.trim().toLowerCase();
      const titleMatch = ticket.title.toLowerCase().includes(query);
      const descMatch = ticket.description?.toLowerCase().includes(query) ?? false;
      if (!titleMatch && !descMatch) return false;
    }

    // Status filter
    if (filters.status !== undefined && filters.status !== '') {
      if (ticket.status !== filters.status) return false;
    }

    // Priority filter
    if (filters.priority !== undefined && filters.priority !== '') {
      if (ticket.priority !== filters.priority) return false;
    }

    // User (assignedToId) filter
    if (filters.userId !== undefined && filters.userId !== '') {
      if (ticket.assignedToId !== filters.userId) return false;
    }

    // Customer filter
    if (filters.customerId !== undefined && filters.customerId !== '') {
      if (ticket.customerId !== filters.customerId) return false;
    }

    // Application filter
    if (filters.applicationId !== undefined && filters.applicationId !== '') {
      if (ticket.applicationId !== filters.applicationId) return false;
    }

    // Overdue filter
    if (filters.overdue === true) {
      const isOverdue =
        ticket.dueDate != null &&
        new Date(ticket.dueDate) < new Date() &&
        !(NON_OVERDUE_STATUSES as readonly string[]).includes(ticket.status);
      if (!isOverdue) return false;
    }

    // Deleted filter
    if (filters.deleted === true) {
      if (!ticket.deletedAt) return false;
    } else if (filters.deleted === false) {
      if (ticket.deletedAt) return false;
    }

    return true;
  });
}
