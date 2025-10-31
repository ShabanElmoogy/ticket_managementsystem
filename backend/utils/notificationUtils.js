import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createNotification = async ({ userId, ticketId, type, title, message }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        ticketId,
        type,
        title,
        message
      }
    });

    // Here you could add real-time notification via WebSocket
    // io.to(userId).emit('notification', notification);

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId, { limit = 50, unreadOnly = false } = {}) => {
  try {
    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return await prisma.notification.findMany({
      where,
      include: {
        ticket: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

export const createBulkNotifications = async (notifications) => {
  try {
    return await prisma.notification.createMany({
      data: notifications
    });
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
    const ticketsDueSoon = await prisma.ticket.findMany({
      where: {
        dueDate: {
          gte: tomorrow,
          lt: nextDay
        },
        status: {
          not: 'CLOSED'
        },
        assignedToId: {
          not: null
        }
      },
      include: {
        assignedTo: true,
        customer: {
          select: { name: true }
        },
        application: {
          select: { name: true }
        }
      }
    });

    // Find overdue tickets
    const now = new Date();
    const overdueTickets = await prisma.ticket.findMany({
      where: {
        dueDate: {
          lt: now
        },
        status: {
          not: 'CLOSED'
        },
        assignedToId: {
          not: null
        }
      },
      include: {
        assignedTo: true,
        customer: {
          select: { name: true }
        },
        application: {
          select: { name: true }
        }
      }
    });

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