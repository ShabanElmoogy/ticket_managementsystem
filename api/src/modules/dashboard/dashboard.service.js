/**
 * dashboard.service.js
 * Business logic for the dashboard module.
 * Orchestrates repository calls, computes derived metrics, shapes responses.
 */

import * as repo from './dashboard.repository.js';

// ── Action → notification type map ────────────────────────────────────────────

const ACTION_TYPE_MAP = {
  CREATED:             'TICKET_CREATED',
  ASSIGNED:            'TICKET_ASSIGNED',
  REASSIGNED:          'TICKET_ASSIGNED',
  PROGRAMMER_ASSIGNED: 'TICKET_ASSIGNED',
  STATUS_CHANGED:      'TICKET_UPDATED',
  PRIORITY_CHANGED:    'TICKET_UPDATED',
  UPDATED:             'TICKET_UPDATED',
  COMMENTED:           'COMMENT_ADDED',
  COMMENT_DELETED:     'COMMENT_DELETED',
  DELETED:             'TICKET_UPDATED',
  RESTORED:            'TICKET_UPDATED',
  PROGRAMMING_UPDATED: 'TICKET_UPDATED',
};

const ASSIGNMENT_ACTIONS = new Set(['ASSIGNED', 'REASSIGNED', 'PROGRAMMER_ASSIGNED']);
const COMMENT_ACTIONS    = new Set(['COMMENTED', 'COMMENT_DELETED']);
const NON_UPDATER_ACTIONS = new Set(['CREATED', 'ASSIGNED', 'REASSIGNED', 'PROGRAMMER_ASSIGNED', 'COMMENTED', 'COMMENT_DELETED']);

// ── Operations ────────────────────────────────────────────────────────────────

/**
 * Aggregate ticket counts + performance metrics for the dashboard stats panel.
 *
 * @param {object} opts
 * @param {string|null} opts.tenantId
 * @param {boolean}     opts.isAdmin
 * @param {string}      opts.userId
 */
export async function getStats({ tenantId, isAdmin, userId }) {
  const [counts, metrics] = await Promise.all([
    repo.getTicketCounts({ tenantId, isAdmin, userId }),
    repo.getPerformanceMetrics(),
  ]);

  const avgResolutionMs    = parseFloat(metrics.resolution?.avgMs ?? 0);
  const avgResolutionHours = avgResolutionMs > 0
    ? Math.round((avgResolutionMs / 3_600_000) * 10) / 10
    : null;

  const avgActual    = parseFloat(metrics.accuracy?.avgActual    ?? 0);
  const avgEstimated = parseFloat(metrics.accuracy?.avgEstimated ?? 0);
  const avgEstimationAccuracy = avgEstimated > 0
    ? Math.round((avgActual / avgEstimated) * 100)
    : null;

  return {
    totalTickets:       counts.total,
    openTickets:        counts.open,
    inProgressTickets:  counts.inProgress,
    resolvedTickets:    counts.resolved,
    avgEstimationAccuracy,
    avgResolutionHours,
  };
}

/**
 * Fetch and shape recent ticket activities for the activity feed.
 *
 * @param {object} opts
 * @param {string|null} opts.tenantId
 * @param {number}      opts.limit
 */
export async function getActivities({ tenantId, limit }) {
  const rows = await repo.findRecentActivities({ tenantId, limit });

  return rows.map((row) => ({
    id:   `activity-${row.id}`,
    type: ACTION_TYPE_MAP[row.action] ?? 'TICKET_UPDATED',
    data: {
      ticket: {
        id:       row.ticketId,
        title:    row.ticketTitle,
        priority: row.ticketPriority,
        status:   row.ticketStatus,
      },
      createdBy:   row.action === 'CREATED'                    ? row.userName : undefined,
      updatedBy:   !NON_UPDATER_ACTIONS.has(row.action)        ? row.userName : undefined,
      description: row.action === 'UPDATED'                    ? row.description : undefined,
      assignedTo:  ASSIGNMENT_ACTIONS.has(row.action)          ? (row.assignedToName ?? row.userName) : undefined,
      reassignedTo: row.action === 'REASSIGNED'                ? row.description : undefined,
      commentBy:   COMMENT_ACTIONS.has(row.action)             ? row.userName : undefined,
      newStatus:   row.action === 'STATUS_CHANGED'             ? row.newValue
                 : row.action === 'UPDATED'                    ? row.newValue
                 : row.action === 'DELETED'                    ? 'DELETED'
                 : row.action === 'RESTORED'                   ? 'RESTORED'
                 : undefined,
    },
    timestamp: row.createdAt,
  }));
}
