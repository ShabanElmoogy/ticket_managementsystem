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

export const getNotifications = async (req, res) => {
  try {
    res.json(await notificationsService.listNotifications(userId(req), {
      limit:      req.query.limit,
      unreadOnly: req.query.unreadOnly,
      tenantId:   tenantId(req),
    }));
  } catch (e) { handleError(res, e, 'Get notifications'); }
};

export const getNotificationCount = async (req, res) => {
  try {
    res.json(await notificationsService.getUnreadCount(userId(req), tenantId(req)));
  } catch (e) { handleError(res, e, 'Get notification count'); }
};

export const markAsRead = async (req, res) => {
  try {
    res.json(await notificationsService.markAsRead(req.params.id, userId(req)));
  } catch (e) { handleError(res, e, 'Mark notification as read'); }
};

export const markAllAsRead = async (req, res) => {
  try {
    res.json(await notificationsService.markAllAsRead(userId(req)));
  } catch (e) { handleError(res, e, 'Mark all notifications as read'); }
};

export const deleteNotification = async (req, res) => {
  try {
    res.json(await notificationsService.deleteNotification(req.params.id, userId(req)));
  } catch (e) { handleError(res, e, 'Delete notification'); }
};
