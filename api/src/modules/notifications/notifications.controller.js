/**
 * notifications.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping on GET/count routes is enforced by enforceTenantScope middleware.
 * Controllers read req.tenantScope — never call getTenantScope() directly.
 * Mutation routes (mark-read, delete) are user-scoped only — no tenant needed.
 */

import { handleError } from '../../errors/index.js';
import * as notificationsService from './notifications.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const userId   = (req) => req.user?.userId ?? req.user?.id;
const tenantId = (req) => req.tenantScope?.type === 'TENANT' ? req.tenantScope.tenantId : null;

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * GET /notifications/feed — all notifications for the tenant (activity feed).
 * Shows every notification in the tenant regardless of which user it belongs to.
 * Requires X-Tenant-Slug header.
 */
export const getTenantFeed = async (req, res) => {
  try {
    const tid = tenantId(req);
    if (!tid) return res.status(403).json({ error: 'Tenant context required' });
    const result = await notificationsService.listTenantNotifications(tid, userId(req), {
      limit:      req.query.limit,
      unreadOnly: req.query.unreadOnly,
    });
    res.set('Cache-Control', 'private, max-age=15');
    res.json(result);
  } catch (e) { handleError(res, e, 'Get tenant feed'); }
};

export const getNotifications = async (req, res) => {
  try {
    if (req.query.page && isNaN(parseInt(req.query.page))) {
      return res.status(400).json({ error: 'Page must be a number' });
    }
    if (req.query.limit && isNaN(parseInt(req.query.limit))) {
      return res.status(400).json({ error: 'Limit must be a number' });
    }

    // No tenantId — notifications are scoped by userId only
    const result = await notificationsService.listNotifications(userId(req), {
      limit:      req.query.limit,
      unreadOnly: req.query.unreadOnly,
      tenantId:   null,
      query:      req.query,
    });

    res.set('Cache-Control', 'private, max-age=30');
    res.json(result);
  } catch (e) { handleError(res, e, 'Get notifications'); }
};

export const getNotificationCount = async (req, res) => {
  try {
    res.json(await notificationsService.getUnreadCount(userId(req), tenantId(req)));
  } catch (e) { handleError(res, e, 'Get notification count'); }
};

export const markAsRead = async (req, res) => {
  try {
    console.log('[markAsRead] id:', req.params.id, '| userId:', userId(req));
    res.json(await notificationsService.markAsRead(req.params.id, userId(req)));
  } catch (e) { handleError(res, e, 'Mark notification as read'); }
};

export const markAllAsRead = async (req, res) => {
  try {
    res.json(await notificationsService.markAllAsRead(userId(req), tenantId(req)));
  } catch (e) { handleError(res, e, 'Mark all notifications as read'); }
};

export const markAsUnread = async (req, res) => {
  try {
    res.json(await notificationsService.markAsUnread(req.params.id, userId(req)));
  } catch (e) { handleError(res, e, 'Mark notification as unread'); }
};

export const markAllAsUnread = async (req, res) => {
  try {
    res.json(await notificationsService.markAllAsUnread(userId(req), tenantId(req)));
  } catch (e) { handleError(res, e, 'Mark all notifications as unread'); }
};

export const deleteNotification = async (req, res) => {
  try {
    res.json(await notificationsService.deleteNotification(req.params.id, userId(req)));
  } catch (e) { handleError(res, e, 'Delete notification'); }
};
