/**
 * pushTokens.controller.js
 * HTTP handlers for push token endpoints.
 * No business logic — only calls service and sends response.
 */

import { handleError } from '../../../errors/index.js';
import * as pushTokensService from './pushTokens.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const userId = (req) => req.user?.userId ?? req.user?.id;

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * POST /notifications/push-token
 * Upserts a push token for the authenticated user.
 * Body: { token: string, platform: 'ios' | 'android' }
 */
export const registerPushToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    const result = await pushTokensService.registerPushToken(userId(req), token, platform);
    res.status(201).json(result);
  } catch (e) { handleError(res, e, 'Register push token'); }
};

/**
 * DELETE /notifications/push-token
 * Deletes all push tokens for the authenticated user.
 */
export const deletePushToken = async (req, res) => {
  try {
    res.json(await pushTokensService.deletePushTokens(userId(req)));
  } catch (e) { handleError(res, e, 'Delete push token'); }
};
