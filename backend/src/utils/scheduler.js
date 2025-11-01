import cron from 'node-cron';
import { db } from '../config/database.js';
import { tickets, notifications } from '../modules/schema.js';
import { eq, and, lt, isNull } from 'drizzle-orm';

export const startNotificationScheduler = () => {
  // Check for overdue tickets every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const overdueTickets = await db
        .select()
        .from(tickets)
        .where(
          and(
            lt(tickets.dueDate, now),
            eq(tickets.status, 'OPEN')
          )
        );

      for (const ticket of overdueTickets) {
        if (ticket.assignedToId) {
          await db.insert(notifications).values({
            title: 'Ticket Overdue',
            message: `Ticket "${ticket.title}" is overdue`,
            type: 'TICKET_OVERDUE',
            userId: ticket.assignedToId,
            ticketId: ticket.id
          });
        }
      }
    } catch (error) {
      console.error('Error checking overdue tickets:', error);
    }
  });

  console.log('Notification scheduler started');
};