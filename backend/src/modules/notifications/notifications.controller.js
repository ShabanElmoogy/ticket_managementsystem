import { db } from '../../config/database.js';
import { notifications } from './notifications.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, count } from 'drizzle-orm';
import { getUserNotifications, markNotificationAsRead } from '../../utils/notificationUtils.js';

// Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, unreadOnly } = req.query;

    // Tenant scoping: prefer resolved tenant context (header/param) but fall back to token tenant.
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;

    const rows = await getUserNotifications(userId, {
      limit: limit ? parseInt(limit) : 50,
      unreadOnly: unreadOnly === 'true',
      tenantId,
    });

    res.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const notification = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);

    if (!notification.length) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updatedNotification = await markNotificationAsRead(id);
    res.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Get notification count
export const getNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;

    const baseWhere = and(eq(notifications.userId, userId), eq(notifications.isRead, false));

    const [result] = tenantId
      ? await db
          .select({ count: count() })
          .from(notifications)
          .leftJoin(users, eq(notifications.userId, users.id))
          .where(and(baseWhere, eq(users.tenantId, tenantId)))
      : await db
          .select({ count: count() })
          .from(notifications)
          .where(baseWhere);

    res.json({ unreadCount: result.count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ error: 'Failed to fetch notification count' });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const notification = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);

    if (!notification.length) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await db.delete(notifications).where(eq(notifications.id, id));

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};
