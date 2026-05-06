import { db } from '../config/database.js';
import { notifications, tickets, users, customers, applications } from '../modules/schema.js';
import { eq, and, not, lt, gte, desc, isNotNull } from 'drizzle-orm';
import { sendPushNotifications } from './expoPushSender.js';
import { findTokensByUserId } from '../modules/notifications/pushTokens/pushTokens.repository.js';

// ── Notification type → deep-link screen mapping ──────────────────────────────

/**
 * Maps a NotificationType to the mobile deep-link screen name.
 * Falls back to 'notifications' for unknown types.
 */
function getDeepLinkScreen(type) {
  switch (type) {
    case 'TICKET_CREATED':
    case 'TICKET_UPDATED':
    case 'TICKET_ASSIGNED':
    case 'COMMENT_ADDED':
    case 'COMMENT_MENTION':
    case 'COMMENT_DELETED':
    case 'STATUS_CHANGED':
    case 'PRIORITY_ESCALATED':
    case 'TICKET_DUE_SOON':
    case 'TICKET_OVERDUE':
      return 'ticket-detail';
    case 'EPIC_FEATURE_STATUS_CHANGED':
      return 'dashboard';
    default:
      return 'notifications';
  }
}

/**
 * Maps a NotificationType to the Android notification channel ID.
 */
function getChannelId(type) {
  switch (type) {
    case 'TICKET_CREATED':
    case 'TICKET_UPDATED':
    case 'TICKET_ASSIGNED':
    case 'STATUS_CHANGED':
    case 'PRIORITY_ESCALATED':
    case 'TICKET_DUE_SOON':
    case 'TICKET_OVERDUE':
      return 'ticket-updates';
    case 'COMMENT_ADDED':
    case 'COMMENT_MENTION':
    case 'COMMENT_DELETED':
      return 'mentions';
    case 'EPIC_FEATURE_STATUS_CHANGED':
      return 'general';
    default:
      return 'ticket-updates';
  }
}

export const createNotification = async ({ userId, ticketId, type, title, message, assigneeName }, req = null) => {
  try {
    const [notification] = await db.insert(notifications).values({
      userId,
      ticketId,
      type,
      title,
      message
    }).returning();

    let ticketTitle = null;
    if (ticketId) {
      const ticketData = await db.select({ title: tickets.title }).from(tickets).where(eq(tickets.id, ticketId)).limit(1);
      if (ticketData.length > 0) {
        ticketTitle = ticketData[0].title;
      }
    }

    const notificationData = {
      id: notification.id,
      type,
      title,
      message,
      data: {
        ticket: ticketId ? { id: ticketId, title: ticketTitle || 'Untitled ticket' } : undefined,
        assignedTo: assigneeName
      },
      timestamp: notification.createdAt,
    };

    if (req?.emitNotification) {
      req.emitNotification(userId, notificationData);
    }

    // ── Push notifications ────────────────────────────────────────────────────
    // Fire-and-forget — push failures must never affect the main notification flow.
    // Fetch the user's registered device tokens and send via Expo Push API.
    try {
      const pushTokenRows = await findTokensByUserId(userId);
      if (pushTokenRows.length > 0) {
        const screen    = getDeepLinkScreen(type);
        const channelId = getChannelId(type);
        const params    = ticketId ? { ticketId } : undefined;

        const messages = pushTokenRows.map((row) => ({
          to:        row.token,
          title,
          body:      message,
          sound:     'default',
          badge:     1,
          channelId,
          data: {
            type,
            screen,
            ...(params ? { params } : {}),
            ...(ticketId ? { ticketId } : {}),
          },
        }));

        // Non-blocking — do not await at the top level
        sendPushNotifications(messages).catch((err) =>
          console.error('[notificationUtils] Push send failed:', err.message)
        );
      }
    } catch (err) {
      // Never let push token lookup crash the notification creation
      console.error('[notificationUtils] Failed to fetch push tokens:', err.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const getUserNotifications = async (
  userId,
  { limit = 50, unreadOnly = false, tenantId = null } = {}
) => {
  try {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    // Tenant scoping:
    // notifications table does not have tenant_id, so we scope by joining users and filtering users.tenantId.
    if (tenantId) {
      conditions.push(eq(users.tenantId, tenantId));
    }

    return await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        ticket: {
          id: tickets.id,
          title: tickets.title
        }
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.userId, users.id))
      .leftJoin(tickets, eq(notifications.ticketId, tickets.id))
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

export const createBulkNotifications = async (notificationData) => {
  try {
    await db.insert(notifications).values(notificationData);
    return { success: true };
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

export const checkDueDateNotifications = async (emitNotification = null) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find tickets due tomorrow
    const ticketsDueSoon = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        assignedToId: tickets.assignedToId,
        customer: {
          name: customers.name
        },
        application: {
          name: applications.name
        }
      })
      .from(tickets)
      .leftJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(applications, eq(tickets.applicationId, applications.id))
      .where(
        and(
          gte(tickets.dueDate, tomorrow),
          lt(tickets.dueDate, nextDay),
          not(eq(tickets.status, 'CLOSED')),
          isNotNull(tickets.assignedToId)
        )
      );

    // Find overdue tickets
    const now = new Date();
    const overdueTickets = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        assignedToId: tickets.assignedToId,
        customer: {
          name: customers.name
        },
        application: {
          name: applications.name
        }
      })
      .from(tickets)
      .leftJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(applications, eq(tickets.applicationId, applications.id))
      .where(
        and(
          lt(tickets.dueDate, now),
          not(eq(tickets.status, 'CLOSED')),
          isNotNull(tickets.assignedToId)
        )
      );

    // Create notifications for tickets due soon
    const dueSoonNotifications = ticketsDueSoon.map(ticket => {
      let message = `Ticket "${ticket.title}" is due tomorrow`;
      if (ticket.customer?.name || ticket.application?.name) {
        const details = [];
        if (ticket.customer?.name) details.push(`Customer: ${ticket.customer.name}`);
        if (ticket.application?.name) details.push(`Application: ${ticket.application.name}`);
        message += ` (${details.join(', ')})`;
      }
      return {
        userId: ticket.assignedToId,
        ticketId: ticket.id,
        type: 'TICKET_DUE_SOON',
        title: 'Ticket Due Soon',
        message
      };
    });

    // Create notifications for overdue tickets
    const overdueNotifications = overdueTickets.map(ticket => {
      let message = `Ticket "${ticket.title}" is overdue`;
      if (ticket.customer?.name || ticket.application?.name) {
        const details = [];
        if (ticket.customer?.name) details.push(`Customer: ${ticket.customer.name}`);
        if (ticket.application?.name) details.push(`Application: ${ticket.application.name}`);
        message += ` (${details.join(', ')})`;
      }
      return {
        userId: ticket.assignedToId,
        ticketId: ticket.id,
        type: 'TICKET_OVERDUE',
        title: 'Ticket Overdue',
        message
      };
    });

    if (dueSoonNotifications.length > 0) {
      for (const n of dueSoonNotifications) {
        const [notification] = await db.insert(notifications).values(n).returning();
        if (emitNotification) {
          emitNotification(n.userId, {
            id: notification.id,
            type: n.type,
            title: n.title,
            message: n.message,
            data: { ticket: { id: n.ticketId, title: n.message } },
            timestamp: notification.createdAt,
          });
        }
      }
    }

    if (overdueNotifications.length > 0) {
      for (const n of overdueNotifications) {
        const [notification] = await db.insert(notifications).values(n).returning();
        if (emitNotification) {
          emitNotification(n.userId, {
            id: notification.id,
            type: n.type,
            title: n.title,
            message: n.message,
            data: { ticket: { id: n.ticketId, title: n.message } },
            timestamp: notification.createdAt,
          });
        }
      }
    }

    return {
      dueSoonCount: dueSoonNotifications.length,
      overdueCount: overdueNotifications.length
    };
  } catch (error) {
    console.error('Error checking due date notifications:', error);
    throw error;
  }
};
