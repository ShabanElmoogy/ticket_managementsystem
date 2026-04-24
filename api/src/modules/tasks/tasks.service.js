/**
 * tasks.service.js
 * Business logic for the tasks module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './tasks.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function listTasks({ boardId, tenantId }) {
  return repo.findAllTasks({ boardId, tenantId: tenantId ?? null });
}

export async function getTask(id, tenantId) {
  const task = await repo.findTaskById(id, tenantId ?? null);
  if (!task) throw fail('Task not found', 404);
  return task;
}

export async function createTask(tenantId, body) {
  const { title, description, boardId, columnId, assigneeId, dueDate, status } = body;

  // Verify board exists, belongs to tenant, and is of type TASKS
  const board = await repo.findBoardInTenant(boardId, tenantId);
  if (!board)              throw fail('Board not found', 404);
  if (board.type !== 'TASKS') throw fail('Board must be of type TASKS');

  // Verify column belongs to this board + tenant
  const column = await repo.findColumnInBoard(columnId, boardId, tenantId);
  if (!column) throw fail('Column not found or does not belong to this board', 404);

  const position = await repo.getNextPosition(columnId, tenantId);

  const task = await repo.insertTask({
    title,
    description:  description || '',
    boardId,
    columnId,
    assigneeId:   assigneeId || null,
    dueDate:      dueDate ? new Date(dueDate) : null,
    status:       status || 'TODO',
    position,
  }, tenantId);

  return task;
}

export async function updateTask(id, tenantId, body) {
  const { title, description, assigneeId, dueDate, status, columnId, position } = body;

  // Verify task exists in tenant
  const existing = await repo.findTaskMeta(id, tenantId);
  if (!existing) throw fail('Task not found', 404);

  // Verify target column belongs to tenant when changing column
  if (columnId != null) {
    const col = await repo.findColumnInTenant(columnId, tenantId);
    if (!col) throw fail('Invalid columnId for tenant');
  }

  const data = {};
  if (title       !== undefined) data.title       = title;
  if (description !== undefined) data.description = description;
  if (assigneeId  !== undefined) data.assigneeId  = assigneeId;
  if (dueDate     !== undefined) data.dueDate     = dueDate ? new Date(dueDate) : null;
  if (status      !== undefined) data.status      = status;
  if (columnId    !== undefined) data.columnId    = columnId;
  if (position    !== undefined) data.position    = position;

  return repo.updateTaskById(id, data, tenantId);
}

export async function deleteTask(id, tenantId) {
  const existing = await repo.findTaskMeta(id, tenantId);
  if (!existing) throw fail('Task not found', 404);

  await repo.deleteTaskById(id);
  return { message: 'Task deleted successfully' };
}

export async function moveTask(id, tenantId, body) {
  const { columnId, position, status } = body;

  const task = await repo.findTaskMeta(id, tenantId ?? null);
  if (!task) throw fail('Task not found', 404);

  // Verify target column belongs to tenant when provided
  if (columnId && tenantId) {
    const col = await repo.findColumnInTenant(columnId, tenantId);
    if (!col) throw fail('Invalid columnId for tenant');
  }

  await repo.updateTaskById(id, {
    columnId,
    position,
    status: status || task.status,
  }, tenantId ?? null);

  return repo.findTaskById(id, tenantId ?? null);
}
