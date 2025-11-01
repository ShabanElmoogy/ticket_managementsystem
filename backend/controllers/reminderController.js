import { db } from '../config/database.js';
import { users, tickets, customers, applications, ticketLabels, labels } from '../drizzle/schema.js';
import { eq, and, or, not, lt, desc, asc } from 'drizzle-orm';

// Get user reminder settings
export const getReminderSettings = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await db
      .select({
        reminderEnabled: users.reminderEnabled,
        reminderInterval: users.reminderInterval
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Get reminder settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user reminder settings
export const updateReminderSettings = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { reminderEnabled, reminderInterval } = req.body;

    const updateData = {};
    if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled;
    if (reminderInterval !== undefined) updateData.reminderInterval = reminderInterval;

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        reminderEnabled: users.reminderEnabled,
        reminderInterval: users.reminderInterval
      });

    res.json(user);
  } catch (error) {
    console.error('Update reminder settings error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get delayed tickets for reminders
export const getDelayedTickets = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await db
      .select({
        reminderEnabled: users.reminderEnabled,
        reminderInterval: users.reminderInterval
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length || !user[0]?.reminderEnabled) {
      return res.json([]);
    }

    const now = new Date();
    const delayThreshold = new Date(now.getTime() - (user[0].reminderInterval * 60 * 1000));

    const ticketsData = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        dueDate: tickets.dueDate,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        customerId: tickets.customerId,
        applicationId: tickets.applicationId,
        createdById: tickets.createdById,
        assignedToId: tickets.assignedToId,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email
        },
        application: {
          id: applications.id,
          name: applications.name,
          version: applications.version
        },
        createdBy: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        assignedTo: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(tickets)
      .leftJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(applications, eq(tickets.applicationId, applications.id))
      .leftJoin(users, eq(tickets.createdById, users.id))
      .leftJoin(users, eq(tickets.assignedToId, users.id))
      .where(
        and(
          eq(tickets.assignedToId, userId),
          not(eq(tickets.status, 'CLOSED')),
          or(
            lt(tickets.dueDate, now),
            lt(tickets.updatedAt, delayThreshold)
          )
        )
      )
      .orderBy(desc(tickets.priority), asc(tickets.dueDate));

    // Get labels for each ticket
    const ticketIds = ticketsData.map(t => t.id);
    const ticketLabelsData = ticketIds.length > 0 ? await db
      .select({
        ticketId: ticketLabels.ticketId,
        label: {
          id: labels.id,
          name: labels.name,
          color: labels.color,
          description: labels.description
        }
      })
      .from(ticketLabels)
      .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
      .where(eq(ticketLabels.ticketId, ticketIds)) : [];

    // Group labels by ticket
    const labelsByTicket = ticketLabelsData.reduce((acc, tl) => {
      if (!acc[tl.ticketId]) acc[tl.ticketId] = [];
      acc[tl.ticketId].push({ label: tl.label });
      return acc;
    }, {});

    // Add labels to tickets
    const ticketsWithLabels = ticketsData.map(ticket => ({
      ...ticket,
      labels: labelsByTicket[ticket.id] || []
    }));

    res.json(ticketsWithLabels);
  } catch (error) {
    console.error('Get delayed tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};