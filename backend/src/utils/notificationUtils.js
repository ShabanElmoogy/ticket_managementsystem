import { db } from '../config/database.js';
import { notifications, tickets, users, customers, applications } from '../../drizzle/schema.js';
import { eq, and, not, lt, gte, desc, isNotNull } from 'drizzle-orm';

export const createNotification = async ({ userId, ticketId, type, title, message }) => {
  try {
    await db.insert(notifications).values({
      userId,
      ticketId,
      type,
      title,
      message
    });

    // Here you could add real-time notification via WebSocket
    // io.to(userId).emit('notification', notification);

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

export const getUserNotifications = async (userId, { limit = 50, unreadOnly = false } = {}) => {
  try {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
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

export const checkDueDateNotifications = async () => {
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
      await createBulkNotifications(dueSoonNotifications);
    }

    if (overdueNotifications.length > 0) {
      await createBulkNotifications(overdueNotifications);
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