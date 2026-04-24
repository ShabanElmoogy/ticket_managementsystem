/**
 * tasks.repository.js
 * All database queries for the tasks module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { tasks } from './tasks.schema.js';
import { users } from '../users/users.schema.js';
import { kanbanBoards, kanbanColumns } from '../kanban/kanban.schema.js';
import { eq, desc, asc, and } from 'drizzle-orm';

// ── Shared column selection ───────────────────────────────────────────────────

const TASK_SELECT = {
  id:          tasks.id,
  title:       tasks.title,
  description: tasks.description,
  boardId:     tasks.boardId,
  columnId:    tasks.columnId,
  assigneeId:  tasks.assigneeId,
  dueDate:     tasks.dueDate,
  status:      tasks.status,
  position:    tasks.position,
  createdAt:   tasks.createdAt,
  updatedAt:   tasks.updatedAt,
  assignee: { id: users.id, name: users.name, email: users.email },
  board:    { id: kanbanBoards.id, name: kanbanBoards.name, type: kanbanBoards.type },
  column:   { id: kanbanColumns.id, name: kanbanColumns.name, color: kanbanColumns.color },
};

// ── Base joined query ─────────────────────────────────────────────────────────

function baseQuery() {
  return db
    .select(TASK_SELECT)
    .from(tasks)
    .leftJoin(users,        eq(tasks.assigneeId, users.id))
    .leftJoin(kanbanBoards, eq(tasks.boardId,    kanbanBoards.id))
    .leftJoin(kanbanColumns, eq(tasks.columnId,  kanbanColumns.id));
}

// ── Task queries ──────────────────────────────────────────────────────────────

/**
 * List tasks, optionally filtered by boardId and/or tenant.
 * Tenant scoping is via kanbanBoards.tenantId (tasks have no tenantId column).
 */
export async function findAllTasks({ boardId, tenantId } = {}) {
  const conditions = [];
  if (boardId)  conditions.push(eq(tasks.boardId, boardId));
  if (tenantId) conditions.push(eq(kanbanBoards.tenantId, tenantId));

  const query = baseQuery();
  return conditions.length
    ? query.where(and(...conditions)).orderBy(asc(tasks.position), desc(tasks.createdAt))
    : query.orderBy(asc(tasks.position), desc(tasks.createdAt));
}

/** Find a single task by ID, optionally tenant-scoped. */
export async function findTaskById(id, tenantId) {
  const where = tenantId
    ? and(eq(tasks.id, id), eq(kanbanBoards.tenantId, tenantId))
    : eq(tasks.id, id);

  const rows = await baseQuery().where(where).limit(1);
  return rows[0] ?? null;
}

/** Find a task's minimal fields (id, status) for existence + move checks. */
export async function findTaskMeta(id, tenantId) {
  const where = tenantId
    ? and(eq(tasks.id, id), eq(kanbanBoards.tenantId, tenantId))
    : eq(tasks.id, id);

  const rows = await db
    .select({ id: tasks.id, status: tasks.status })
    .from(tasks)
    .leftJoin(kanbanBoards, eq(tasks.boardId, kanbanBoards.id))
    .where(where)
    .limit(1);

  return rows[0] ?? null;
}

/** Insert a new task, returns the created row (with joins). */
export async function insertTask(values, tenantId) {
  const [newTask] = await db.insert(tasks).values(values).returning();
  const rows = await baseQuery()
    .where(and(eq(tasks.id, newTask.id), eq(kanbanBoards.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Update a task by ID, returns the updated row (with joins). */
export async function updateTaskById(id, data, tenantId) {
  await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id));
  return findTaskById(id, tenantId);
}

/** Delete a task by ID. */
export async function deleteTaskById(id) {
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ── Board / column validation helpers ────────────────────────────────────────

/** Find a board by ID scoped to a tenant. Returns { id, type } or null. */
export async function findBoardInTenant(boardId, tenantId) {
  const rows = await db
    .select({ id: kanbanBoards.id, type: kanbanBoards.type })
    .from(kanbanBoards)
    .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Find a column by ID scoped to a board and tenant. Returns { id } or null. */
export async function findColumnInBoard(columnId, boardId, tenantId) {
  const rows = await db
    .select({ id: kanbanColumns.id })
    .from(kanbanColumns)
    .where(and(
      eq(kanbanColumns.id, columnId),
      eq(kanbanColumns.boardId, boardId),
      eq(kanbanColumns.tenantId, tenantId),
    ))
    .limit(1);
  return rows[0] ?? null;
}

/** Find a column by ID scoped to a tenant (for move/update validation). */
export async function findColumnInTenant(columnId, tenantId) {
  const rows = await db
    .select({ id: kanbanColumns.id })
    .from(kanbanColumns)
    .where(and(eq(kanbanColumns.id, columnId), eq(kanbanColumns.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Get the next available position in a column (max + 1). */
export async function getNextPosition(columnId, tenantId) {
  const rows = await db
    .select({ position: tasks.position })
    .from(tasks)
    .leftJoin(kanbanBoards, eq(tasks.boardId, kanbanBoards.id))
    .where(and(eq(tasks.columnId, columnId), eq(kanbanBoards.tenantId, tenantId)))
    .orderBy(desc(tasks.position))
    .limit(1);
  return rows.length ? rows[0].position + 1 : 0;
}
