import { prisma } from '../config/database.js';

// Get user reminder settings
export const getReminderSettings = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        reminderEnabled: true,
        reminderInterval: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
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

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        reminderEnabled: true,
        reminderInterval: true
      }
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
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reminderEnabled: true, reminderInterval: true }
    });

    if (!user?.reminderEnabled) {
      return res.json([]);
    }

    const now = new Date();
    const delayThreshold = new Date(now.getTime() - (user.reminderInterval * 60 * 1000));

    const tickets = await prisma.ticket.findMany({
      where: {
        assignedToId: userId,
        status: { not: 'CLOSED' },
        OR: [
          { dueDate: { lt: now } }, // Overdue tickets
          { updatedAt: { lt: delayThreshold } } // Tickets not updated within interval
        ]
      },
      include: {
        customer: { select: { name: true } },
        application: { select: { name: true } },
        createdBy: { select: { name: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    res.json(tickets);
  } catch (error) {
    console.error('Get delayed tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};