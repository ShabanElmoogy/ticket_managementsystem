/**
 * activityUtils.js
 *
 * Unified activity + notification utility.
 *
 * logActivity()              — writes to ticket_activities only (audit log)
 * logActivityAndNotify()     — writes to ticket_activities AND creates notifications
 *                              for all relevant users in one call.
 *
 * Design principle:
 *   ticket_activities = immutable audit log (what happened)
 *   notifications     = user inbox (who needs to know)
 *
 * Both are written atomically from the same call so the activity feed
 * (which reads from notifications) always reflects every ticket action.
 */

import { db } from '../config/database.js';
import { ticketActivities, users, tickets } from '../modules/schema.js';
import { eq, desc, inArray } from 'drizzle-orm';
import { createNotification } from './notificationUtils.js';

// ─────────────────────────────────────────────────────────────────────────────
// Action → notification type map
// ─────────────────────────────────────────────────────────────────────────────

const ACTION_TO_NOTIFICATION_TYPE = {
  CREATED:             'TICKET_CREATED',
  ASSIGNED:            'TICKET_ASSIGNED',
  REASSIGNED:          'TICKET_ASSIGNED',
  PROGRAMMER_ASSIGNED: 'TICKET_ASSIGNED',
  STATUS_CHANGED:      'STATUS_CHANGED',
  PRIORITY_CHANGED:    'PRIORITY_ESCALATED',
  UPDATED:             'TICKET_UPDATED',
  COMMENTED:           'COMMENT_ADDED',
  COMMENT_DELETED:     'COMMENT_DELETED',
  DELETED:             'TICKET_UPDATED',
  RESTORED:            'TICKET_UPDATED',
  PROGRAMMING_UPDATED: 'TICKET_UPDATED',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the tenant ID for a ticket by looking up the creator's tenant.
 * Used when tenantId is not passed directly.
 */
async function resolveTenantId(ticketId) {
  const rows = await db
    .select({ tenantId: users.tenantId })
    .from(ticketActivities)
    .innerJoin(users, eq(ticketActivities.userId, users.id))
    .where(eq(ticketActivities.ticketId, ticketId))
    .limit(1);
  return rows[0]?.tenantId ?? null;
}

/**
 * Build a human-readable notification title + message for an action.
 */
function buildNotificationContent(action, ticketTitle, actorName, extra = {}) {
  const t = ticketTitle ?? 'a ticket';
  const a = actorName   ?? 'Someone';

  switch (action) {
    case 'CREATED':
      return { title: 'New Ticket Created', message: `"${t}" was created by ${a}` };
    case 'ASSIGNED':
      return { title: 'Ticket Assigned', message: `"${t}" was assigned to ${extra.assigneeName ?? 'you'} by ${a}` };
    case 'REASSIGNED':
      return { title: 'Ticket Reassigned', message: `"${t}" was reassigned to ${extra.assigneeName ?? 'you'} by ${a}` };
    case 'PROGRAMMER_ASSIGNED':
      return { title: 'Sent to Programmer', message: `"${t}" was sent to programmer ${extra.assigneeName ?? 'you'} by ${a}` };
    case 'STATUS_CHANGED':
      return { title: 'Status Changed', message: `"${t}" status changed to ${extra.newValue ?? 'unknown'} by ${a}` };
    case 'PRIORITY_CHANGED':
      return { title: 'Priority Changed', message: `"${t}" priority changed to ${extra.newValue ?? 'unknown'} by ${a}` };
    case 'UPDATED':
      return { title: 'Ticket Updated', message: `"${t}" was updated by ${a}` };
    case 'COMMENTED':
      return { title: 'New Comment', message: `${a} commented on "${t}"` };
    case 'COMMENT_DELETED':
      return { title: 'Comment Deleted', message: `${a} deleted a comment on "${t}"` };
    case 'DELETED':
      return { title: 'Ticket Deleted', message: `"${t}" was deleted by ${a}` };
    case 'RESTORED':
      return { title: 'Ticket Restored', message: `"${t}" was restored by ${a}` };
    default:
      return { title: 'Ticket Updated', message: `"${t}" was updated by ${a}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: write to ticket_activities
// ─────────────────────────────────────────────────────────────────────────────

export const logActivity = async ({ ticketId, userId, action, description, oldValue, newValue }) => {
  try {
    await db.insert(ticketActivities).values({
      ticketId,
      userId,
      action,
      description,
      oldValue: oldValue?.toString(),
      newValue: newValue?.toString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Enhanced: write to ticket_activities + notifications in one call
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Log a ticket activity AND create notifications for all relevant users.
 *
 * @param {object} opts
 * @param {string}   opts.ticketId    - Ticket UUID
 * @param {string}   opts.actorId     - User who performed the action
 * @param {string}   opts.action      - Activity action string (CREATED, STATUS_CHANGED, etc.)
 * @param {string}   opts.description - Human-readable description for the audit log
 * @param {string}   [opts.oldValue]  - Previous value (for change tracking)
 * @param {string}   [opts.newValue]  - New value (for change tracking)
 * @param {string}   [opts.tenantId]  - Tenant UUID (resolved automatically if omitted)
 * @param {string[]} [opts.notifyUserIds] - Explicit list of user IDs to notify.
 *                                          If omitted, defaults to: assignee + creator + actor
 * @param {string}   [opts.assigneeName]  - Name of the assignee (for ASSIGNED actions)
 * @param {object}   [req]            - Express request (for socket emit via req.emitNotification)
 */
export const logActivityAndNotify = async ({
  ticketId,
  actorId,
  action,
  description,
  oldValue,
  newValue,
  tenantId,
  notifyUserIds,
  assigneeName,
}, req = null) => {
  // 1. Write audit log
  await logActivity({ ticketId, userId: actorId, action, description, oldValue, newValue });

  // 2. Resolve ticket info for notification content
  let ticketTitle = null;
  let assignedToId = null;
  let createdById = null;
  let resolvedTenantId = tenantId ?? null;

  try {
    const rows = await db
      .select({
        title:       tickets.title,
        assignedToId: tickets.assignedToId,
        createdById:  tickets.createdById,
      })
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (rows[0]) {
      ticketTitle  = rows[0].title;
      assignedToId = rows[0].assignedToId;
      createdById  = rows[0].createdById;
    }

    // Resolve tenantId from actor if not provided
    if (!resolvedTenantId) {
      const actorRows = await db
        .select({ tenantId: users.tenantId })
        .from(users)
        .where(eq(users.id, actorId))
        .limit(1);
      resolvedTenantId = actorRows[0]?.tenantId ?? null;
    }
  } catch (err) {
    console.error('[logActivityAndNotify] Failed to resolve ticket info:', err.message);
    return { success: true }; // Don't fail the main operation
  }

  // 3. Determine who to notify
  const recipientIds = notifyUserIds
    ? [...new Set(notifyUserIds.filter(Boolean))]
    : [...new Set([assignedToId, createdById, actorId].filter(Boolean))];

  if (!recipientIds.length) return { success: true };

  // 4. Build notification content
  let actorName = null;
  try {
    const actorRows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, actorId))
      .limit(1);
    actorName = actorRows[0]?.name ?? null;
  } catch { /* non-critical */ }

  const notifType = ACTION_TO_NOTIFICATION_TYPE[action] ?? 'TICKET_UPDATED';
  const { title, message } = buildNotificationContent(action, ticketTitle, actorName, {
    newValue,
    assigneeName,
  });

  // 5. Create one notification row per recipient (fire-and-forget — never block the main flow)
  Promise.all(
    recipientIds.map((userId) =>
      createNotification({
        userId,
        ticketId,
        tenantId: resolvedTenantId,
        type:     notifType,
        title,
        message,
        assigneeName,
      }, req).catch((err) =>
        console.error(`[logActivityAndNotify] Failed to notify user ${userId}:`, err.message)
      )
    )
  ).catch(() => {});

  return { success: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// Read helpers (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export const getTicketActivities = async (ticketId, { limit = 50 } = {}) => {
  try {
    return await db
      .select({
        id:          ticketActivities.id,
        action:      ticketActivities.action,
        description: ticketActivities.description,
        oldValue:    ticketActivities.oldValue,
        newValue:    ticketActivities.newValue,
        createdAt:   ticketActivities.createdAt,
        user: {
          id:    users.id,
          name:  users.name,
          email: users.email,
        },
      })
      .from(ticketActivities)
      .innerJoin(users, eq(ticketActivities.userId, users.id))
      .where(eq(ticketActivities.ticketId, ticketId))
      .orderBy(desc(ticketActivities.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching ticket activities:', error);
    throw error;
  }
};

export const getUserActivities = async (userId, { limit = 100 } = {}) => {
  try {
    return await db
      .select({
        id:          ticketActivities.id,
        action:      ticketActivities.action,
        description: ticketActivities.description,
        oldValue:    ticketActivities.oldValue,
        newValue:    ticketActivities.newValue,
        createdAt:   ticketActivities.createdAt,
        ticket: {
          id:    tickets.id,
          title: tickets.title,
        },
      })
      .from(ticketActivities)
      .innerJoin(tickets, eq(ticketActivities.ticketId, tickets.id))
      .where(eq(ticketActivities.userId, userId))
      .orderBy(desc(ticketActivities.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
};

export const getBoardActivities = async (boardId, { limit = 100 } = {}) => {
  try {
    return await db
      .select({
        id:          ticketActivities.id,
        action:      ticketActivities.action,
        description: ticketActivities.description,
        oldValue:    ticketActivities.oldValue,
        newValue:    ticketActivities.newValue,
        createdAt:   ticketActivities.createdAt,
        user: {
          id:    users.id,
          name:  users.name,
          email: users.email,
        },
        ticket: {
          id:    tickets.id,
          title: tickets.title,
        },
      })
      .from(ticketActivities)
      .innerJoin(users,   eq(ticketActivities.userId,   users.id))
      .innerJoin(tickets, eq(ticketActivities.ticketId, tickets.id))
      .where(eq(tickets.boardId, boardId))
      .orderBy(desc(ticketActivities.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching board activities:', error);
    throw error;
  }
};
