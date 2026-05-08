import cron from 'node-cron';
import { db } from '../config/database.js';
import { tickets, notifications, users } from '../modules/schema.js';
import { tenants } from '../modules/tenants/tenants.schema.js';
import { eq, and, lt, isNull, isNotNull, inArray, or, lte } from 'drizzle-orm';
import { logActivity, logActivityAndNotify } from './activityUtils.js';

const PRIORITY_LADDER = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

let _emitNotification = null;
let _escalationTask = null;
let _currentIntervalMinutes = parseInt(process.env.ESCALATION_INTERVAL_MINUTES || '60', 10);

export const getEscalationInterval = () => _currentIntervalMinutes;

export const setEscalationInterval = (minutes) => {
  const parsed = parseInt(minutes, 10);
  if (isNaN(parsed) || parsed < 1) throw new Error('Interval must be a positive integer (minutes)');
  _currentIntervalMinutes = parsed;
  console.log(`[Scheduler] Global fallback interval updated to ${_currentIntervalMinutes} min`);
  return _currentIntervalMinutes;
};

export const escalatePriorities = async () => {
  try {
    const now = new Date();

    // Load all tenants with their escalation interval
    const allTenants = await db
      .select({ id: tenants.id, escalationIntervalMinutes: tenants.escalationIntervalMinutes })
      .from(tenants);

    // Build a map: tenantId → intervalMinutes
    const tenantIntervalMap = new Map(
      allTenants.map((t) => [t.id, t.escalationIntervalMinutes ?? 60])
    );

    // Find all overdue active tickets
    const overdueTickets = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        priority: tickets.priority,
        assignedToId: tickets.assignedToId,
        createdById: tickets.createdById,
        lastEscalatedAt: tickets.lastEscalatedAt,
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

    // Fetch creator tenantIds to know which interval applies per ticket
    const creatorIds = [...new Set(overdueTickets.map((t) => t.createdById))];
    const creators = await db
      .select({ id: users.id, tenantId: users.tenantId })
      .from(users)
      .where(inArray(users.id, creatorIds));
    const creatorTenantMap = new Map(creators.map((u) => [u.id, u.tenantId]));

    const escalated = [];

    for (const ticket of overdueTickets) {
      const currentIndex = PRIORITY_LADDER.indexOf(ticket.priority);
      if (currentIndex === -1 || currentIndex === PRIORITY_LADDER.length - 1) continue;

      // Respect per-tenant interval: skip if escalated too recently
      const tenantId = creatorTenantMap.get(ticket.createdById);
      const intervalMinutes = tenantId
        ? (tenantIntervalMap.get(tenantId) ?? _currentIntervalMinutes)
        : _currentIntervalMinutes;

      if (ticket.lastEscalatedAt) {
        const minutesSinceLast = (now - new Date(ticket.lastEscalatedAt)) / 60000;
        if (minutesSinceLast < intervalMinutes) continue;
      }

      const newPriority = PRIORITY_LADDER[currentIndex + 1];

      await db
        .update(tickets)
        .set({ priority: newPriority, lastEscalatedAt: now, updatedAt: now })
        .where(eq(tickets.id, ticket.id));

      await logActivityAndNotify({
        ticketId:    ticket.id,
        actorId:     ticket.createdById,
        action:      'PRIORITY_CHANGED',
        description: `Auto-escalated: overdue (${ticket.priority} → ${newPriority})`,
        oldValue:    ticket.priority,
        newValue:    newPriority,
        tenantId:    tenantId ?? null,
        notifyUserIds: ticket.assignedToId ? [ticket.assignedToId] : [],
      });

      escalated.push({ ...ticket, newPriority, tenantId });
    }

    if (escalated.length === 0) return;

    // Notifications: assignee + tenant admins
    const tenantIds = [...new Set(escalated.map((t) => t.tenantId).filter(Boolean))];
    const tenantAdmins = tenantIds.length > 0
      ? await db
          .select({ id: users.id, tenantId: users.tenantId })
          .from(users)
          .where(and(inArray(users.tenantId, tenantIds), eq(users.role, 'TENANT_ADMIN')))
      : [];

    const notificationRows = [];
    for (const ticket of escalated) {
      const adminsForTenant = tenantAdmins.filter((a) => a.tenantId === ticket.tenantId);
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
      if (_emitNotification) {
        for (const n of notificationRows) {
          _emitNotification(n.userId, {
            type: 'PRIORITY_ESCALATED',
            data: {
              ticket: { id: n.ticketId, title: n.message },
              newPriority: escalated.find((t) => t.id === n.ticketId)?.newPriority,
            },
            timestamp: now.toISOString(),
          });
        }
      }
    }

    console.log(`[Scheduler] Escalated ${escalated.length} ticket(s):`, escalated.map((t) => `${t.id} ${t.priority}→${t.newPriority}`));
  } catch (error) {
    console.error('[Scheduler] Error escalating priorities:', error);
  }
};

export const startNotificationScheduler = (emitNotification = null) => {
  _emitNotification = emitNotification;

  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const overdueTickets = await db.select().from(tickets).where(and(lt(tickets.dueDate, now), eq(tickets.status, 'OPEN')));
      for (const ticket of overdueTickets) {
        if (ticket.assignedToId) {
          const [notification] = await db.insert(notifications).values({
            title: 'Ticket Overdue',
            message: `Ticket "${ticket.title}" is overdue`,
            type: 'TICKET_OVERDUE',
            userId: ticket.assignedToId,
            ticketId: ticket.id,
          }).returning();
          if (_emitNotification) {
            _emitNotification(ticket.assignedToId, {
              id: notification.id,
              type: 'TICKET_OVERDUE',
              title: 'Ticket Overdue',
              message: `Ticket "${ticket.title}" is overdue`,
              data: { ticket: { id: ticket.id, title: ticket.title } },
              timestamp: notification.createdAt,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking overdue tickets:', error);
    }
  });

  // Run escalation every minute — each ticket respects its tenant's interval via lastEscalatedAt
  _escalationTask = cron.schedule('* * * * *', escalatePriorities);
  console.log(`[Scheduler] Escalation cron running every minute — per-tenant intervals enforced via lastEscalatedAt`);

  console.log('Notification scheduler started');
};