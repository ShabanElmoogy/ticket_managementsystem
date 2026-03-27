import cron from 'node-cron';
import { db } from '../config/database.js';
import { tickets, notifications, users } from '../modules/schema.js';
import { eq, and, lt, isNull, isNotNull, inArray, or } from 'drizzle-orm';
import { logActivity } from './activityUtils.js';

const PRIORITY_LADDER = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const escalatePriorities = async () => {
  try {
    const now = new Date();

    // Find all overdue, non-escalated-to-URGENT tickets that are still active
    const overdueTickets = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        priority: tickets.priority,
        assignedToId: tickets.assignedToId,
        createdById: tickets.createdById,
      })
      .from(tickets)
      .where(
        and(
          lt(tickets.dueDate, now),
          isNotNull(tickets.dueDate),
          isNull(tickets.deletedAt),
          or(eq(tickets.status, 'OPEN'), eq(tickets.status, 'IN_PROGRESS'))
        )
      );

    if (overdueTickets.length === 0) return;

    const escalated = [];

    for (const ticket of overdueTickets) {
      const currentIndex = PRIORITY_LADDER.indexOf(ticket.priority);
      // Already at URGENT — nothing to escalate
      if (currentIndex === -1 || currentIndex === PRIORITY_LADDER.length - 1) continue;

      const newPriority = PRIORITY_LADDER[currentIndex + 1];

      await db
        .update(tickets)
        .set({ priority: newPriority, updatedAt: now })
        .where(eq(tickets.id, ticket.id));

      await logActivity({
        ticketId: ticket.id,
        userId: ticket.createdById,
        action: 'PRIORITY_CHANGED',
        description: `Auto-escalated: overdue (${ticket.priority} → ${newPriority})`,
        oldValue: ticket.priority,
        newValue: newPriority,
      });

      escalated.push({ ...ticket, newPriority });
    }

    if (escalated.length === 0) return;

    // Build notifications for assignees + all tenant admins
    const notificationRows = [];

    // Collect unique tenant IDs from the creators of escalated tickets
    const creatorIds = [...new Set(escalated.map((t) => t.createdById))];
    const creators = await db
      .select({ id: users.id, tenantId: users.tenantId })
      .from(users)
      .where(inArray(users.id, creatorIds));

    const tenantIds = [...new Set(creators.map((u) => u.tenantId).filter(Boolean))];

    // Fetch all tenant admins for those tenants
    const tenantAdmins = tenantIds.length > 0
      ? await db
          .select({ id: users.id, tenantId: users.tenantId })
          .from(users)
          .where(
            and(
              inArray(users.tenantId, tenantIds),
              eq(users.role, 'TENANT_ADMIN')
            )
          )
      : [];

    for (const ticket of escalated) {
      const creator = creators.find((c) => c.id === ticket.createdById);
      const adminsForTenant = tenantAdmins.filter((a) => a.tenantId === creator?.tenantId);

      const recipients = new Set();
      if (ticket.assignedToId) recipients.add(ticket.assignedToId);
      adminsForTenant.forEach((a) => recipients.add(a.id));

      for (const userId of recipients) {
        notificationRows.push({
          userId,
          ticketId: ticket.id,
          type: 'PRIORITY_ESCALATED',
          title: 'Priority Auto-Escalated',
          message: `Ticket "${ticket.title}" priority escalated to ${ticket.newPriority} (overdue)`,
        });
      }
    }

    if (notificationRows.length > 0) {
      await db.insert(notifications).values(notificationRows);
    }

    console.log(`[Scheduler] Escalated ${escalated.length} ticket(s):`, escalated.map((t) => `${t.id} ${t.priority}→${t.newPriority}`));
  } catch (error) {
    console.error('[Scheduler] Error escalating priorities:', error);
  }
};

export { escalatePriorities };

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

  // Auto-escalate priorities every hour
  cron.schedule('0 * * * *', escalatePriorities);

  console.log('Notification scheduler started');
};