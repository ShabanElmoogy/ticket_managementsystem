/**
 * expoPushSender.js
 * Sends push notifications via the Expo Push API.
 *
 * Responsibilities:
 *  - Batches up to 100 messages per request (Expo rate limit)
 *  - Handles DeviceNotRegistered ticket errors → deletes stale token from DB
 *  - Handles MessageTooBig ticket errors → truncates body to 256 chars and retries once
 */

import { deleteTokenByValue } from '../modules/notifications/pushTokens/pushTokens.repository.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const EXPO_PUSH_URL  = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE     = 100;
const MAX_BODY_CHARS = 256;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Send a single batch of up to 100 messages to the Expo Push API.
 * Returns the array of push tickets from the response.
 *
 * @param {Object[]} batch - Array of Expo push message objects
 * @returns {Promise<Object[]>} Array of push tickets
 */
async function sendBatch(batch) {
  const response = await fetch(EXPO_PUSH_URL, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify(batch),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Expo Push API error ${response.status}: ${text}`);
  }

  const json = await response.json();
  return json.data ?? [];
}

/**
 * Process push tickets returned by the Expo Push API.
 * Handles error tickets:
 *  - DeviceNotRegistered → delete the stale token from the database
 *  - MessageTooBig       → truncate body and retry once
 *
 * @param {Object[]} tickets  - Push tickets from Expo
 * @param {Object[]} messages - Original messages that produced these tickets (same order)
 */
async function processTickets(tickets, messages) {
  const retryMessages = [];

  for (let i = 0; i < tickets.length; i++) {
    const ticket  = tickets[i];
    const message = messages[i];

    if (!ticket || ticket.status === 'ok') continue;

    const details = ticket.details ?? {};

    if (details.error === 'DeviceNotRegistered') {
      // Token is no longer valid — remove it so we stop sending to it
      if (message?.to) {
        try {
          await deleteTokenByValue(message.to);
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[ExpoPushSender] Removed stale token: ${message.to}`);
          }
        } catch (err) {
          console.error('[ExpoPushSender] Failed to delete stale token:', err.message);
        }
      }
      continue;
    }

    if (details.error === 'MessageTooBig') {
      // Truncate body to 256 chars and queue for a single retry
      if (message?.body) {
        retryMessages.push({
          ...message,
          body: message.body.slice(0, MAX_BODY_CHARS),
        });
      }
      continue;
    }

    // Log other errors but don't crash
    console.warn('[ExpoPushSender] Push ticket error:', ticket.message ?? details.error ?? 'Unknown error', '| to:', message?.to);
  }

  // Retry truncated messages once — no further retry to avoid infinite loops
  if (retryMessages.length > 0) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ExpoPushSender] Retrying ${retryMessages.length} truncated message(s)`);
      }
      const retryTickets = await sendBatch(retryMessages);
      // Process retry tickets — only handle DeviceNotRegistered on retry (no further truncation)
      for (let i = 0; i < retryTickets.length; i++) {
        const ticket  = retryTickets[i];
        const message = retryMessages[i];
        if (ticket?.details?.error === 'DeviceNotRegistered' && message?.to) {
          await deleteTokenByValue(message.to).catch((err) =>
            console.error('[ExpoPushSender] Failed to delete stale token on retry:', err.message)
          );
        }
      }
    } catch (err) {
      console.error('[ExpoPushSender] Retry batch failed:', err.message);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send push notifications via the Expo Push API.
 * Automatically batches messages into groups of 100.
 * Handles DeviceNotRegistered and MessageTooBig errors.
 *
 * @param {Object[]} messages - Array of Expo push message objects.
 *   Each message should have: { to, title, body, data?, sound?, badge?, channelId? }
 * @returns {Promise<void>}
 */
export async function sendPushNotifications(messages) {
  if (!messages || messages.length === 0) return;

  // Filter out any messages without a valid Expo push token
  const validMessages = messages.filter(
    (m) => m?.to && typeof m.to === 'string' && m.to.startsWith('ExponentPushToken[')
  );

  if (validMessages.length === 0) return;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ExpoPushSender] Sending ${validMessages.length} push notification(s)`);
  }

  // Split into batches of BATCH_SIZE (100)
  for (let i = 0; i < validMessages.length; i += BATCH_SIZE) {
    const batch = validMessages.slice(i, i + BATCH_SIZE);
    try {
      const tickets = await sendBatch(batch);
      await processTickets(tickets, batch);
    } catch (err) {
      // Log but never crash the caller — push failures must not affect the main flow
      console.error('[ExpoPushSender] Batch send failed:', err.message);
    }
  }
}
