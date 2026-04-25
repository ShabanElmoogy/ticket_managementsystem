/**
 * kanban.repository.js
 * All database queries for the kanban module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { kanbanBoards, kanbanColumns, boardPermissions } from './kanban.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { customers } from '../customers/customers.schema.js';
import { applications } from '../applications/applications.schema.js';
import { tasks } from '../tasks/tasks.schema.js';
import { eq, and, asc, count, inArray, or, sql } from 'drizzle-orm';

// ── Shared column selections ──────────────────────────────────────────────────

const TICKET_SELECT = {
  id:              tickets.id,
  title:           tickets.title,
  description:     tickets.description,
  status:          tickets.status,
  priority:        tickets.priority,
  boardId:         tickets.boardId,
  assignedToId:    tickets.assignedToId,
  createdById:     tickets.createdById,
  customerId:      tickets.customerId,
  applicationId:   tickets.applicationId,
  assignedToName:  users.name,
  assignedToEmail: users.email,
  customerName:    customers.name,
  applicationName: applications.name,
};

const TASK_SELECT = {
  id:            tasks.id,
  title:         tasks.title,
  description:   tasks.description,
  status:        tasks.status,
  priority:      tasks.priority,
  position:      tasks.position,
  boardId:       tasks.boardId,
  columnId:      tasks.columnId,
  assigneeId:    tasks.assigneeId,
  assigneeName:  users.name,
  assigneeEmail: users.email,
};

// ── Board queries ─────────────────────────────────────────────────────────────

/** List all active boards, optionally scoped to a tenant. */
export async function findAllBoards(tenantId, options = {}) {
  const { limit, offset, search } = options;
  
  let query = db.select().from(kanbanBoards);

  // Base filter for active boards
  const baseFilter = eq(kanbanBoards.isActive, true);
  const tenantFilter = tenantId ? eq(kanbanBoards.tenantId, tenantId) : undefined;

  // Add search functionality
  if (search) {
    const searchFilter = or(
      sql`${kanbanBoards.name} ILIKE ${`%${search}%`}`,
      sql`${kanbanBoards.description} ILIKE ${`%${search}%`}`
    );
    
    query = query.where(
      tenantFilter 
        ? and(baseFilter, tenantFilter, searchFilter)
        : and(baseFilter, searchFilter)
    );
  } else {
    query = query.where(
      tenantFilter 
        ? and(baseFilter, tenantFilter)
        : baseFilter
    );
  }

  // Add pagination if requested
  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.offset(offset);
  }

  return query;
}

/** Count all active boards for pagination. */
export async function countAllBoards(tenantId, options = {}) {
  const { search } = options;
  
  let query = db.select({ count: count() }).from(kanbanBoards);

  // Base filter for active boards
  const baseFilter = eq(kanbanBoards.isActive, true);
  const tenantFilter = tenantId ? eq(kanbanBoards.tenantId, tenantId) : undefined;

  // Add search functionality
  if (search) {
    const searchFilter = or(
      sql`${kanbanBoards.name} ILIKE ${`%${search}%`}`,
      sql`${kanbanBoards.description} ILIKE ${`%${search}%`}`
    );
    
    query = query.where(
      tenantFilter 
        ? and(baseFilter, tenantFilter, searchFilter)
        : and(baseFilter, searchFilter)
    );
  } else {
    query = query.where(
      tenantFilter 
        ? and(baseFilter, tenantFilter)
        : baseFilter
    );
  }

  const [{ count: total }] = await query;
  return Number(total);
}

/** Find a single board by ID, optionally scoped to a tenant. */
export async function findBoardById(id, tenantId) {
  const where = tenantId
    ? and(eq(kanbanBoards.id, id), eq(kanbanBoards.tenantId, tenantId))
    : eq(kanbanBoards.id, id);
  const rows = await db.select().from(kanbanBoards).where(where).limit(1);
  return rows[0] ?? null;
}

/** Insert a new board, returns the created row. */
export async function insertBoard(values) {
  const [row] = await db.insert(kanbanBoards).values(values).returning();
  return row;
}

/** Update a board by ID (tenant-scoped), returns the updated row. */
export async function updateBoardById(id, tenantId, data) {
  const [row] = await db
    .update(kanbanBoards)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(kanbanBoards.id, id), eq(kanbanBoards.tenantId, tenantId)))
    .returning();
  return row ?? null;
}

/** Delete a board by ID (tenant-scoped). */
export async function deleteBoardById(id, tenantId) {
  await db.delete(kanbanBoards).where(and(eq(kanbanBoards.id, id), eq(kanbanBoards.tenantId, tenantId)));
}

// ── Column queries ────────────────────────────────────────────────────────────

/** List active columns for a set of board IDs, optionally tenant-scoped. */
export async function findColumnsByBoardIds(boardIds, tenantId) {
  if (!boardIds.length) return [];
  const where = tenantId
    ? and(eq(kanbanColumns.isActive, true), eq(kanbanColumns.tenantId, tenantId), inArray(kanbanColumns.boardId, boardIds))
    : and(eq(kanbanColumns.isActive, true), inArray(kanbanColumns.boardId, boardIds));
  return db.select().from(kanbanColumns).where(where).orderBy(asc(kanbanColumns.position));
}

/** List active columns for a single board, optionally tenant-scoped. */
export async function findColumnsByBoardId(boardId, tenantId) {
  const where = tenantId
    ? and(eq(kanbanColumns.boardId, boardId), eq(kanbanColumns.isActive, true), eq(kanbanColumns.tenantId, tenantId))
    : and(eq(kanbanColumns.boardId, boardId), eq(kanbanColumns.isActive, true));
  return db.select().from(kanbanColumns).where(where).orderBy(asc(kanbanColumns.position));
}

/** Find a column by ID, optionally tenant-scoped. */
export async function findColumnById(id, tenantId) {
  const where = tenantId
    ? and(eq(kanbanColumns.id, id), eq(kanbanColumns.tenantId, tenantId))
    : eq(kanbanColumns.id, id);
  const rows = await db.select({ id: kanbanColumns.id }).from(kanbanColumns).where(where).limit(1);
  return rows[0] ?? null;
}

/** Insert a new column, returns the created row. */
export async function insertColumn(values) {
  const [row] = await db.insert(kanbanColumns).values(values).returning();
  return row;
}

/** Bulk-insert columns (used when creating a board with default columns). */
export async function insertColumns(values) {
  await db.insert(kanbanColumns).values(values);
}

/** Fetch all columns for a board (used after bulk insert). */
export async function findAllColumnsForBoard(boardId, tenantId) {
  return db.select().from(kanbanColumns)
    .where(and(eq(kanbanColumns.boardId, boardId), eq(kanbanColumns.tenantId, tenantId)));
}

/** Update a column by ID (tenant-scoped), returns the updated row. */
export async function updateColumnById(id, tenantId, data) {
  const [row] = await db
    .update(kanbanColumns)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.tenantId, tenantId)))
    .returning();
  return row ?? null;
}

/** Delete a column by ID (tenant-scoped). */
export async function deleteColumnById(id, tenantId) {
  await db.delete(kanbanColumns).where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.tenantId, tenantId)));
}

// ── Permission queries ────────────────────────────────────────────────────────

/** Fetch permissions for a set of board IDs with user info, optionally tenant-scoped. */
export async function findPermissionsByBoardIds(boardIds, tenantId) {
  if (!boardIds.length) return [];
  const where = tenantId
    ? and(eq(boardPermissions.tenantId, tenantId), inArray(boardPermissions.boardId, boardIds))
    : inArray(boardPermissions.boardId, boardIds);
  return db
    .select({
      boardId:   boardPermissions.boardId,
      userId:    boardPermissions.userId,
      role:      boardPermissions.role,
      userName:  users.name,
      userEmail: users.email,
    })
    .from(boardPermissions)
    .innerJoin(users, eq(users.id, boardPermissions.userId))
    .where(where);
}

/** Fetch permissions for a single board with user info, optionally tenant-scoped. */
export async function findPermissionsByBoardId(boardId, tenantId) {
  const where = tenantId
    ? and(eq(boardPermissions.boardId, boardId), eq(boardPermissions.tenantId, tenantId))
    : eq(boardPermissions.boardId, boardId);
  return db
    .select({
      userId:    boardPermissions.userId,
      role:      boardPermissions.role,
      userName:  users.name,
      userEmail: users.email,
    })
    .from(boardPermissions)
    .innerJoin(users, eq(users.id, boardPermissions.userId))
    .where(where);
}

/** Insert a board permission. */
export async function insertPermission(values) {
  await db.insert(boardPermissions).values(values);
}

/** Fetch all permissions for a board (used after insert). */
export async function findAllPermissionsForBoard(boardId, tenantId) {
  return db.select().from(boardPermissions)
    .where(and(eq(boardPermissions.boardId, boardId), eq(boardPermissions.tenantId, tenantId)));
}

/** Find a user by ID (for permission response enrichment). */
export async function findUserById(userId) {
  const rows = await db
    .select({ name: users.name, email: users.email })
    .from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ?? null;
}

// ── Ticket queries ────────────────────────────────────────────────────────────

/** Fetch tickets for a board with joined user/customer/application names. */
export async function findTicketsByBoardId(boardId) {
  return db
    .select(TICKET_SELECT)
    .from(tickets)
    .leftJoin(users, eq(users.id, tickets.assignedToId))
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .leftJoin(applications, eq(applications.id, tickets.applicationId))
    .where(eq(tickets.boardId, boardId));
}

/** Find a ticket by ID. */
export async function findTicketById(ticketId) {
  const rows = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  return rows[0] ?? null;
}

/** Update a ticket (for move operation). */
export async function updateTicketById(ticketId, data) {
  await db.update(tickets).set(data).where(eq(tickets.id, ticketId));
}

// ── Task queries ──────────────────────────────────────────────────────────────

/** Fetch tasks for a board with joined assignee names. */
export async function findTasksByBoardId(boardId) {
  return db
    .select(TASK_SELECT)
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.assigneeId))
    .where(eq(tasks.boardId, boardId))
    .orderBy(asc(tasks.position));
}

/** Update a task (for move operation). */
export async function updateTaskById(taskId, data) {
  await db.update(tasks).set(data).where(eq(tasks.id, taskId));
}

// ── Analytics ─────────────────────────────────────────────────────────────────

/** Count tickets and tasks for a board. */
export async function getBoardCounts(boardId) {
  const [[ticketRow], [taskRow]] = await Promise.all([
    db.select({ count: count() }).from(tickets).where(eq(tickets.boardId, boardId)),
    db.select({ count: count() }).from(tasks).where(eq(tasks.boardId, boardId)),
  ]);
  return {
    ticketCount: Number(ticketRow.count),
    taskCount:   Number(taskRow.count),
  };
}
