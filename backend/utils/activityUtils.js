import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logActivity = async ({ ticketId, userId, action, description, oldValue, newValue }) => {
  try {
    const activity = await prisma.ticketActivity.create({
      data: {
        ticketId,
        userId,
        action,
        description,
        oldValue: oldValue?.toString(),
        newValue: newValue?.toString()
      }
    });

    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

export const getTicketActivities = async (ticketId, { limit = 50 } = {}) => {
  try {
    return await prisma.ticketActivity.findMany({
      where: { ticketId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('Error fetching ticket activities:', error);
    throw error;
  }
};

export const getUserActivities = async (userId, { limit = 100 } = {}) => {
  try {
    return await prisma.ticketActivity.findMany({
      where: { userId },
      include: {
        ticket: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
};

export const getBoardActivities = async (boardId, { limit = 100 } = {}) => {
  try {
    return await prisma.ticketActivity.findMany({
      where: {
        ticket: {
          boardId
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        ticket: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('Error fetching board activities:', error);
    throw error;
  }
};