import { db } from '../config/database.js';
import { ticketActivities, users, tickets } from '../modules/schema.js';
import { eq, desc } from 'drizzle-orm';

export const logActivity = async ({ ticketId, userId, action, description, oldValue, newValue }) => {
  try {
    await db.insert(ticketActivities).values({
      ticketId,
      userId,
      action,
      description,
      oldValue: oldValue?.toString(),
      newValue: newValue?.toString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

export const getTicketActivities = async (ticketId, { limit = 50 } = {}) => {
  try {
    return await db
      .select({
        id: ticketActivities.id,
        action: ticketActivities.action,
        description: ticketActivities.description,
        oldValue: ticketActivities.oldValue,
        newValue: ticketActivities.newValue,
        createdAt: ticketActivities.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        }
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
        id: ticketActivities.id,
        action: ticketActivities.action,
        description: ticketActivities.description,
        oldValue: ticketActivities.oldValue,
        newValue: ticketActivities.newValue,
        createdAt: ticketActivities.createdAt,
        ticket: {
          id: tickets.id,
          title: tickets.title
        }
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
        id: ticketActivities.id,
        action: ticketActivities.action,
        description: ticketActivities.description,
        oldValue: ticketActivities.oldValue,
        newValue: ticketActivities.newValue,
        createdAt: ticketActivities.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        ticket: {
          id: tickets.id,
          title: tickets.title
        }
      })
      .from(ticketActivities)
      .innerJoin(users, eq(ticketActivities.userId, users.id))
      .innerJoin(tickets, eq(ticketActivities.ticketId, tickets.id))
      .where(eq(tickets.boardId, boardId))
      .orderBy(desc(ticketActivities.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching board activities:', error);
    throw error;
  }
};