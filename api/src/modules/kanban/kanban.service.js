/**
 * kanban.service.js
 * Business logic for the kanban module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './kanban.repository.js';
import { parsePaginationParams, buildPaginatedResponse, parseSearchParam } from '../../utils/pagination.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Response shaping ──────────────────────────────────────────────────────────

function shapePermissions(rows) {
  return rows.map((p) => ({
    boardId: p.boardId,
    userId:  p.userId,
    role:    p.role,
    user:    { name: p.userName, email: p.userEmail },
  }));
}

function shapeBoardPermissions(rows) {
  return rows.map((p) => ({
    userId: p.userId,
    role:   p.role,
    user:   { name: p.userName, email: p.userEmail },
  }));
}

// ── Board type normalisation ──────────────────────────────────────────────────

function normaliseBoardType(type) {
  if (!type) return 'TICKETS';
  const t = type.toString().toUpperCase();
  if (t === 'TASKS' || t === 'TASK')       return 'TASKS';
  if (t === 'TICKETS' || t === 'TICKET')   return 'TICKETS';
  return 'TICKETS';
}

// ── Default columns ───────────────────────────────────────────────────────────

const DEFAULT_COLUMNS = [
  { name: 'To Do',       position: 0, color: '#e3f2fd' },
  { name: 'In Progress', position: 1, color: '#fff3e0' },
  { name: 'Review',      position: 2, color: '#f3e5f5' },
  { name: 'Done',        position: 3, color: '#e8f5e8' },
];

// ── Operations ────────────────────────────────────────────────────────────────

/**
 * List boards with optional pagination and search.
 * @param {string|null} tenantId - Tenant ID for scoping
 * @param {Object} query - Query parameters from request
 * @returns {Array|Object} Array of boards or paginated response
 */
export async function listBoards(tenantId, query = {}) {
  const search = parseSearchParam(query);
  
  // Check if pagination is requested
  const hasPagination = 'page' in query || 'limit' in query;
  
  if (!hasPagination) {
    // Legacy behavior - return all boards with full data
    const boards   = await repo.findAllBoards(tenantId ?? null, { search });
    const boardIds = boards.map((b) => b.id);

    const [columns, permissions] = await Promise.all([
      repo.findColumnsByBoardIds(boardIds, tenantId ?? null),
      repo.findPermissionsByBoardIds(boardIds, tenantId ?? null),
    ]);

    const nestedPermissions = shapePermissions(permissions);

    // Fetch tickets/tasks per board — N boards but unavoidable (different board types)
    return Promise.all(boards.map(async (board) => {
      const boardColumns = columns.filter((c) => c.boardId === board.id);
      const boardPerms   = nestedPermissions.filter((p) => p.boardId === board.id);

      if (board.type === 'TASKS') {
        const boardTasks = await repo.findTasksByBoardId(board.id);
        return { ...board, columns: boardColumns, permissions: boardPerms, tasks: boardTasks, tickets: [] };
      }

      const boardTickets = await repo.findTicketsByBoardId(board.id);
      return { ...board, columns: boardColumns, permissions: boardPerms, tickets: boardTickets, tasks: [] };
    }));
  }

  // Paginated response with validation - simplified without full nested data
  const { page, limit, offset } = parsePaginationParams(query);
  
  // Additional validation for pagination parameters
  if (page < 1) {
    throw fail('Page must be >= 1', 400);
  }
  if (limit < 1 || limit > 100) {
    throw fail('Limit must be between 1 and 100', 400);
  }

  // Execute count and data queries in parallel for optimal performance
  const [boards, total] = await Promise.all([
    repo.findAllBoards(tenantId ?? null, { limit, offset, search }),
    repo.countAllBoards(tenantId ?? null, { search }),
  ]);

  // For paginated response, return boards without nested data for performance
  return buildPaginatedResponse(boards, total, page, limit);
}

export async function getBoardById(id, tenantId) {
  const board = await repo.findBoardById(id, tenantId ?? null);
  if (!board) throw fail('Board not found', 404);

  const [columns, permissions] = await Promise.all([
    repo.findColumnsByBoardId(id, tenantId ?? null),
    repo.findPermissionsByBoardId(id, tenantId ?? null),
  ]);

  const nestedPermissions = shapeBoardPermissions(permissions);

  if (board.type === 'TASKS') {
    const boardTasks = await repo.findTasksByBoardId(id);
    return { ...board, columns, permissions: nestedPermissions, tasks: boardTasks, tickets: [] };
  }

  const boardTickets = await repo.findTicketsByBoardId(id);
  return { ...board, columns, permissions: nestedPermissions, tickets: boardTickets, tasks: [] };
}

export async function createBoard(tenantId, body, userId) {
  const { name, description, columns, type, isDefault } = body;

  const boardType = normaliseBoardType(type);

  const board = await repo.insertBoard({
    tenantId,
    name,
    description,
    type:      boardType,
    isDefault: isDefault || false,
  });

  // Build columns — use provided or fall back to defaults
  const columnsToCreate = columns?.length
    ? columns.map((col, i) => ({
        tenantId,
        boardId:     board.id,
        name:        col.name,
        description: col.description,
        color:       col.color,
        position:    i,
        wipLimit:    col.wipLimit,
      }))
    : DEFAULT_COLUMNS.map((col) => ({ tenantId, boardId: board.id, ...col }));

  await repo.insertColumns(columnsToCreate);
  const createdColumns = await repo.findAllColumnsForBoard(board.id, tenantId);

  // Grant creator ADMIN permission
  await repo.insertPermission({ tenantId, boardId: board.id, userId, role: 'ADMIN' });
  const rawPerms = await repo.findAllPermissionsForBoard(board.id, tenantId);

  // Enrich permissions with user info
  const createdPermissions = await Promise.all(
    rawPerms.map(async (perm) => {
      const user = await repo.findUserById(perm.userId);
      return { ...perm, user: user ?? { name: 'Unknown', email: 'unknown@example.com' } };
    }),
  );

  return { ...board, columns: createdColumns, permissions: createdPermissions };
}

export async function updateBoard(id, tenantId, body) {
  const { name, description, type } = body;

  const data = {};
  if (name        !== undefined) data.name        = name;
  if (description !== undefined) data.description = description;
  if (type        !== undefined) data.type        = type;

  const updated = await repo.updateBoardById(id, tenantId, data);
  if (!updated) throw fail('Board not found', 404);
  return updated;
}

export async function deleteBoard(id, tenantId) {
  await repo.deleteBoardById(id, tenantId);
  return { message: 'Board deleted successfully' };
}

// ── Column operations ─────────────────────────────────────────────────────────

export async function addColumn(boardId, tenantId, body) {
  const board = await repo.findBoardById(boardId, tenantId);
  if (!board) throw fail('Board not found', 404);

  const { name, description, color, position, wipLimit } = body;

  return repo.insertColumn({ tenantId, boardId, name, description, color, position, wipLimit });
}

export async function updateColumn(columnId, tenantId, body) {
  const { name, description, color, wipLimit } = body;

  const data = {};
  if (name        !== undefined) data.name        = name;
  if (description !== undefined) data.description = description;
  if (color       !== undefined) data.color       = color;
  if (wipLimit    !== undefined) data.wipLimit     = wipLimit;

  const updated = await repo.updateColumnById(columnId, tenantId, data);
  if (!updated) throw fail('Column not found', 404);
  return updated;
}

export async function deleteColumn(columnId, tenantId) {
  await repo.deleteColumnById(columnId, tenantId);
  return { message: 'Column deleted successfully' };
}

// ── Move operations ───────────────────────────────────────────────────────────

export async function moveTicket(ticketId, tenantId, body) {
  const { newStatus, newPosition, boardId } = body;

  // Verify board belongs to tenant when provided
  if (boardId && tenantId) {
    const board = await repo.findBoardById(boardId, tenantId);
    if (!board) throw fail('Board not found', 404);
  }

  const data = {};
  if (newStatus   !== undefined) data.status   = newStatus;
  if (newPosition !== undefined) data.position = newPosition;
  if (boardId     !== undefined) data.boardId  = boardId;

  await repo.updateTicketById(ticketId, data);

  const ticket = await repo.findTicketById(ticketId);
  if (!ticket) throw fail('Ticket not found', 404);
  return ticket;
}

export async function moveTask(taskId, tenantId, body) {
  const { columnId, position } = body;

  // Verify column belongs to tenant when provided
  if (columnId && tenantId) {
    const col = await repo.findColumnById(columnId, tenantId);
    if (!col) throw fail('Column not found', 404);
  }

  await repo.updateTaskById(taskId, { columnId, position });
  return { message: 'Task moved successfully' };
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getBoardAnalytics(boardId, tenantId) {
  if (tenantId) {
    const board = await repo.findBoardById(boardId, tenantId);
    if (!board) throw fail('Board not found', 404);
  }
  return repo.getBoardCounts(boardId);
}
