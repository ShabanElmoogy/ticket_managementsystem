/**
 * epicContributors.service.js
 * Business logic for epic contributors.
 */

import * as repo from './epicContributors.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function listContributors(epicId) {
  const rows = await repo.findContributorsByEpicId(epicId);
  return rows.map((r) => ({
    id:        r.id,
    role:      r.role,
    createdAt: r.createdAt,
    user:      { id: r.userId, name: r.userName, email: r.userEmail },
  }));
}

export async function addContributor(epicId, userId, role = 'OTHER') {
  if (!userId) throw fail('userId is required');

  const epic = await repo.findEpicById(epicId);
  if (!epic) throw fail('Epic not found', 404);

  const user = await repo.findUserById(userId);
  if (!user) throw fail('User not found', 404);

  const row = await repo.upsertContributor(epicId, userId, role);

  return {
    id:        row.id,
    role:      row.role,
    createdAt: row.createdAt,
    user:      { id: user.id, name: user.name, email: user.email },
  };
}

export async function updateContributor(contributorId, role) {
  if (!role) throw fail('role is required');

  const row = await repo.updateContributorRole(contributorId, role);
  if (!row) throw fail('Contributor not found', 404);

  return row;
}

export async function removeContributor(contributorId) {
  await repo.deleteContributorById(contributorId);
  return { message: 'Contributor removed' };
}
