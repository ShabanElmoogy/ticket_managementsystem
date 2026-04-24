/**
 * features.service.js
 * Business logic for the features module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './features.repository.js';
import { logEpicActivity } from '../epics/epicActivity/epicActivity.service.js';
import { createNotification } from '../../utils/notificationUtils.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Vote attachment ───────────────────────────────────────────────────────────

async function attachVotes(rows, userId) {
  if (!rows.length) return [];
  const ids      = rows.map((r) => r.id);
  const allVotes = await repo.findVotesForFeatures(ids);
  return rows.map((r) => ({
    ...r,
    voteCount: allVotes.filter((v) => v.featureRequestId === r.id).length,
    votedByMe: allVotes.some((v) => v.featureRequestId === r.id && v.userId === userId),
  }));
}

// ── Epic auto-completion ──────────────────────────────────────────────────────

/**
 * After a feature status change, check if all active features in the epic
 * are now SHIPPED. If so, optionally auto-complete the epic.
 *
 * Returns extra fields for the response when all features are shipped:
 *   { allShipped, epicId, autoCloseEnabled, openTickets }
 */
async function checkEpicAutoCompletion(epicId, changedFeatureId, newStatus, actorId, req) {
  if (newStatus !== 'SHIPPED') return null;

  const epic = await repo.findEpicMeta(epicId);
  if (!epic || epic.status === 'COMPLETED') return null;

  const allFeatures = await repo.findFeatureStatusesByEpicId(epicId);
  const active      = allFeatures.filter((f) => f.status !== 'DECLINED');
  const allShipped  = active.length > 0 && active.every((f) => f.status === 'SHIPPED');

  if (!allShipped) return null;

  // Determine auto-close setting
  let autoCloseEnabled = true;
  if (epic.tenantId) {
    autoCloseEnabled = await repo.findTenantAutoCloseSetting(epic.tenantId);
  }

  // Count open linked tickets
  const linkedTickets = await repo.findTicketStatusesByEpicId(epicId);
  const openTickets   = linkedTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

  return { allShipped: true, epicId, autoCloseEnabled, openTickets };
}

/**
 * Notify epic owner + actor of a feature status change.
 */
async function notifyFeatureStatusChange(epicId, featureId, featureTitle, fromStatus, toStatus, actorId, req) {
  const epic = await repo.findEpicMeta(epicId);
  if (!epic) return;

  const notifyIds = [...new Set([epic.ownerId, actorId].filter(Boolean))];
  for (const userId of notifyIds) {
    await createNotification({
      userId,
      ticketId: null,
      type:     'EPIC_FEATURE_STATUS_CHANGED',
      title:    'Feature status updated',
      message:  `Feature "${featureTitle}" changed to ${toStatus} in epic "${epic.title}"`,
    }, req);
  }

  await logEpicActivity(epicId, actorId, 'FEATURE_STATUS_CHANGED', {
    featureId,
    featureTitle,
    from: fromStatus,
    to:   toStatus,
  });
}

// ── Feature operations ────────────────────────────────────────────────────────

export async function listFeatures(tenantId, userId) {
  const rows = await repo.findAllFeatures(tenantId ?? null);
  return attachVotes(rows, userId);
}

export async function getFeature(id, userId) {
  const row = await repo.findFeatureById(id);
  if (!row) throw fail('Feature request not found', 404);
  const [result] = await attachVotes([row], userId);
  return result;
}

export async function createFeature(tenantId, body, submittedById) {
  const { title, description, applicationId, customerId } = body;
  if (!title?.trim() || !description?.trim()) throw fail('title and description are required');

  const row = await repo.insertFeature({
    title:         title.trim(),
    description:   description.trim(),
    tenantId:      tenantId ?? null,
    submittedById,
    applicationId: applicationId || null,
    customerId:    customerId || null,
  });

  return { ...row, voteCount: 0, votedByMe: false, applicationName: null, customerName: null };
}

export async function updateFeature(id, body, actorId, req) {
  const existing = await repo.findFeatureMeta(id);
  if (!existing) throw fail('Feature request not found', 404);

  const { title, description, status, linkedTicketId, applicationId, customerId } = body;

  const patch = {};
  if (title          !== undefined) patch.title          = title;
  if (description    !== undefined) patch.description    = description;
  if (status         !== undefined) patch.status         = status;
  if (linkedTicketId !== undefined) patch.linkedTicketId = linkedTicketId || null;
  if (applicationId  !== undefined) patch.applicationId  = applicationId  || null;
  if (customerId     !== undefined) patch.customerId     = customerId     || null;

  const updated = await repo.updateFeatureById(id, patch);

  // Status change side-effects
  if (status !== undefined && status !== existing.status && existing.epicId) {
    await notifyFeatureStatusChange(existing.epicId, id, existing.title, existing.status, status, actorId, req);

    const autoCloseInfo = await checkEpicAutoCompletion(existing.epicId, id, status, actorId, req);
    if (autoCloseInfo) {
      return { ...updated, ...autoCloseInfo };
    }
  }

  return updated;
}

export async function deleteFeature(id) {
  await repo.deleteFeatureById(id);
  return { message: 'Deleted' };
}

export async function toggleVote(featureRequestId, userId) {
  const existing = await repo.findVote(featureRequestId, userId);

  if (existing) {
    await repo.deleteVoteById(existing.id);
  } else {
    await repo.insertVote(featureRequestId, userId);
  }

  const voteCount = await repo.countVotes(featureRequestId);
  return { voteCount, votedByMe: !existing };
}

// ── Step operations ───────────────────────────────────────────────────────────

export async function listSteps(featureRequestId) {
  const rows = await repo.findStepsByFeatureId(featureRequestId);
  return repo.enrichSteps(rows);
}

export async function createStep(featureRequestId, body) {
  const { title, description, assignedToId, assignedProgrammerId, linkedTicketId } = body;
  if (!title?.trim()) throw fail('title is required');

  const nextOrder = await repo.getNextStepOrder(featureRequestId);

  const row = await repo.insertStep({
    featureRequestId,
    title:                title.trim(),
    description:          description?.trim() || null,
    order:                nextOrder,
    assignedToId:         assignedToId         || null,
    assignedProgrammerId: assignedProgrammerId || null,
    linkedTicketId:       linkedTicketId       || null,
  });

  return { ...row, assignedTo: null, assignedProgrammer: null, linkedTicket: null };
}

export async function updateStep(featureRequestId, stepId, body, actorId, req) {
  const { title, description, status, order, assignedToId, assignedProgrammerId, linkedTicketId } = body;

  const patch = {};
  if (title                !== undefined) patch.title                = title;
  if (description          !== undefined) patch.description          = description || null;
  if (status               !== undefined) patch.status               = status;
  if (order                !== undefined) patch.order                = order;
  if (assignedToId         !== undefined) patch.assignedToId         = assignedToId         || null;
  if (assignedProgrammerId !== undefined) patch.assignedProgrammerId = assignedProgrammerId || null;
  if (linkedTicketId       !== undefined) patch.linkedTicketId       = linkedTicketId       || null;

  const updated = await repo.updateStepById(stepId, patch);
  if (!updated) throw fail('Step not found', 404);

  // Auto-promote feature to SHIPPED when all steps are DONE
  if (status === 'DONE') {
    const allSteps = await repo.findStepStatusesByFeatureId(featureRequestId);
    if (allSteps.length > 0 && allSteps.every((s) => s.status === 'DONE')) {
      const feat = await repo.updateFeatureById(featureRequestId, { status: 'SHIPPED' });

      // Auto-complete epic when all its features are SHIPPED
      if (feat?.epicId) {
        const epicFeatures = await repo.findFeatureStatusesByEpicId(feat.epicId);
        const active       = epicFeatures.filter((f) => f.status !== 'DECLINED');
        if (active.length > 0 && active.every((f) => f.status === 'SHIPPED')) {
          await repo.completeEpic(feat.epicId);
        }

        // Notify epic owner
        const epic = await repo.findEpicMeta(feat.epicId);
        if (epic) {
          const notifyIds = [...new Set([epic.ownerId, actorId].filter(Boolean))];
          for (const userId of notifyIds) {
            await createNotification({
              userId,
              ticketId: null,
              type:     'EPIC_FEATURE_STATUS_CHANGED',
              title:    'Feature status updated',
              message:  `Feature "${feat.title}" changed to SHIPPED in epic "${epic.title}"`,
            }, req);
          }
        }
      }
    }
  }

  return updated;
}

export async function deleteStep(stepId) {
  await repo.deleteStepById(stepId);
  return { message: 'Deleted' };
}
