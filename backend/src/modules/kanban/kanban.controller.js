import { db } from '../../config/database.js';
import { kanbanBoards, kanbanColumns, boardPermissions } from './kanban.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { customers } from '../customers/customers.schema.js';
import { applications } from '../applications/applications.schema.js';
import { tasks } from '../tasks/tasks.schema.js';
import { eq, and, asc, count } from 'drizzle-orm';

// Get all boards
export const getAllBoards = async (req, res) => {
  try {
    // Get boards with columns
    const boards = await db
      .select()
      .from(kanbanBoards)
      .where(eq(kanbanBoards.isActive, true));

    // Get columns for all boards
    const columns = await db
      .select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.isActive, true))
      .orderBy(asc(kanbanColumns.position));

    // Get permissions for all boards
    const permissions = await db
      .select({
        boardId: boardPermissions.boardId,
        userId: boardPermissions.userId,
        role: boardPermissions.role,
        userName: users.name,
        userEmail: users.email
      })
      .from(boardPermissions)
      .innerJoin(users, eq(users.id, boardPermissions.userId));

    // Nest user data
    const nestedPermissions = permissions.map(perm => ({
      boardId: perm.boardId,
      userId: perm.userId,
      role: perm.role,
      user: {
        name: perm.userName,
        email: perm.userEmail
      }
    }));

    // Assign tickets/tasks to boards based on board type
    const boardsWithItems = await Promise.all(boards.map(async board => {
      const boardColumns = columns.filter(col => col.boardId === board.id);
      const boardPermissions = nestedPermissions.filter(perm => perm.boardId === board.id);
      
      if (board.type === 'TASKS') {
        const boardTasks = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            description: tasks.description,
            status: tasks.status,
            priority: tasks.priority,
            position: tasks.position,
            boardId: tasks.boardId,
            columnId: tasks.columnId,
            assigneeId: tasks.assigneeId,
            assigneeName: users.name,
            assigneeEmail: users.email
          })
          .from(tasks)
          .leftJoin(users, eq(users.id, tasks.assigneeId))
          .where(eq(tasks.boardId, board.id))
          .orderBy(asc(tasks.position));

        return {
          ...board,
          columns: boardColumns,
          permissions: boardPermissions,
          tasks: boardTasks,
          tickets: []
        };
      } else {
        const boardTickets = await db
          .select({
            id: tickets.id,
            title: tickets.title,
            description: tickets.description,
            status: tickets.status,
            priority: tickets.priority,
            boardId: tickets.boardId,
            assignedToId: tickets.assignedToId,
            createdById: tickets.createdById,
            customerId: tickets.customerId,
            applicationId: tickets.applicationId,
            assignedToName: users.name,
            assignedToEmail: users.email,
            customerName: customers.name,
            applicationName: applications.name
          })
          .from(tickets)
          .leftJoin(users, eq(users.id, tickets.assignedToId))
          .leftJoin(customers, eq(customers.id, tickets.customerId))
          .leftJoin(applications, eq(applications.id, tickets.applicationId))
          .where(
            board.isDefault 
              ? and(eq(tickets.boardId, board.id)) // If it's a default board, only show tickets explicitly assigned to it
              : eq(tickets.boardId, board.id)
          );

        return {
          ...board,
          columns: boardColumns,
          permissions: boardPermissions,
          tickets: boardTickets,
          tasks: []
        };
      }
    }));

    res.json(boardsWithItems);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ 
      error: 'Failed to fetch boards',
      details: error.message 
    });
  }
};

// Get board by ID
export const getBoardById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [board] = await db
      .select()
      .from(kanbanBoards)
      .where(eq(kanbanBoards.id, id))
      .limit(1);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Get columns for this board
    const boardColumns = await db
      .select()
      .from(kanbanColumns)
      .where(and(eq(kanbanColumns.boardId, id), eq(kanbanColumns.isActive, true)))
      .orderBy(asc(kanbanColumns.position));

    // Get permissions for this board
    const permissions = await db
      .select({
        userId: boardPermissions.userId,
        role: boardPermissions.role,
        userName: users.name,
        userEmail: users.email
      })
      .from(boardPermissions)
      .innerJoin(users, eq(users.id, boardPermissions.userId))
      .where(eq(boardPermissions.boardId, id));

    // Nest user data
    const nestedPermissions = permissions.map(perm => ({
      userId: perm.userId,
      role: perm.role,
      user: {
        name: perm.userName,
        email: perm.userEmail
      }
    }));

    let boardWithItems;

    if (board.type === 'TASKS') {
      const boardTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          position: tasks.position,
          assigneeId: tasks.assigneeId,
          assigneeName: users.name,
          assigneeEmail: users.email
        })
        .from(tasks)
        .leftJoin(users, eq(users.id, tasks.assigneeId))
        .where(eq(tasks.boardId, id))
        .orderBy(asc(tasks.position));

      boardWithItems = {
        ...board,
        columns: boardColumns,
        permissions: nestedPermissions,
        tasks: boardTasks,
        tickets: []
      };
    } else {
      const boardTickets = await db
        .select({
          id: tickets.id,
          title: tickets.title,
          description: tickets.description,
          status: tickets.status,
          priority: tickets.priority,
          boardId: tickets.boardId,
          assignedToId: tickets.assignedToId,
          createdById: tickets.createdById,
          customerId: tickets.customerId,
          applicationId: tickets.applicationId,
          assignedToName: users.name,
          assignedToEmail: users.email,
          customerName: customers.name,
          applicationName: applications.name
        })
        .from(tickets)
        .leftJoin(users, eq(users.id, tickets.assignedToId))
        .leftJoin(customers, eq(customers.id, tickets.customerId))
        .leftJoin(applications, eq(applications.id, tickets.applicationId))
        .where(
          board.isDefault
            ? and(eq(tickets.boardId, id)) // If it's a default board, only show tickets explicitly assigned to it
            : eq(tickets.boardId, id)
        );

      boardWithItems = {
        ...board,
        columns: boardColumns,
        permissions: nestedPermissions,
        tickets: boardTickets,
        tasks: []
      };
    }

    res.json(boardWithItems);
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
};

// Create new board
export const createBoard = async (req, res) => {
  console.log('=== CREATE BOARD REQUEST START ===');
    console.log('Request body:', req.body);
    
    try {
      const { name, description, columns, type, isDefault } = req.body;
      // Ensure req.user and req.user.id are present
      if (!req.user || !req.user.userId) { // Check for req.user.userId
        console.error('Authentication error: req.user or req.user.userId is missing.');
        return res.status(401).json({ error: 'Authentication required: User ID not found.' });
      }
      const userId = req.user.userId; // Use req.user.userId to match the payload

    console.log('Raw type value:', type);

    // Normalize the type value
    let boardType = 'TICKETS';
    if (type) {
      const normalizedType = type.toString().toUpperCase();
      if (normalizedType === 'TASKS' || normalizedType === 'TASK') {
        boardType = 'TASKS';
      } else if (normalizedType === 'TICKETS' || normalizedType === 'TICKET') {
        boardType = 'TICKETS';
      }
    }

    console.log('Normalized board type:', boardType);

    // Create board
    await db
      .insert(kanbanBoards)
      .values({
        name,
        description,
        type: boardType,
        isDefault: isDefault || false
      });

    const [board] = await db.select().from(kanbanBoards).where(eq(kanbanBoards.name, name)).limit(1);

    // Create columns
    const defaultColumns = [
      { name: 'To Do', position: 0, color: '#e3f2fd' },
      { name: 'In Progress', position: 1, color: '#fff3e0' },
      { name: 'Review', position: 2, color: '#f3e5f5' },
      { name: 'Done', position: 3, color: '#e8f5e8' }
    ];

    const columnsToCreate = columns?.map((col, index) => ({
      boardId: board.id,
      name: col.name,
      description: col.description,
      color: col.color,
      position: index,
      wipLimit: col.wipLimit
    })) || defaultColumns.map(col => ({
      boardId: board.id,
      ...col
    }));

    await db.insert(kanbanColumns).values(columnsToCreate);
    const createdColumns = await db.select().from(kanbanColumns).where(eq(kanbanColumns.boardId, board.id));

    // Create permissions
    await db.insert(boardPermissions).values({
      boardId: board.id,
      userId: userId, // Use the corrected userId variable
      role: 'ADMIN'
    });
    const createdPermissions = await db.select().from(boardPermissions).where(eq(boardPermissions.boardId, board.id));

    // Nest user data for created permissions
    const nestedCreatedPermissions = await Promise.all(createdPermissions.map(async (perm) => {
      const user = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, perm.userId)).limit(1);
      return {
        ...perm,
        user: user[0] || { name: 'Unknown', email: 'unknown@example.com' }
      };
    }));

    const boardWithRelations = {
      ...board,
      columns: createdColumns,
      permissions: nestedCreatedPermissions
    };

    console.log('Board created successfully:', board.id);
    res.status(201).json(boardWithRelations);
  } catch (error) {
    console.error('=== CREATE BOARD REQUEST ERROR ===');
    console.error('Error creating board:', error);
    
    res.status(500).json({ 
      error: 'Failed to create board',
      details: error.message
    });
  }
};

// Update board
export const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type) updateData.type = type;
    updateData.updatedAt = new Date();

    await db.update(kanbanBoards).set(updateData).where(eq(kanbanBoards.id, id));
    const [updatedBoard] = await db.select().from(kanbanBoards).where(eq(kanbanBoards.id, id)).limit(1);

    if (!updatedBoard) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json(updatedBoard);
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ error: 'Failed to update board' });
  }
};

// Delete board
export const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;

    await db.delete(kanbanBoards).where(eq(kanbanBoards.id, id));

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
};

// Move ticket
export const moveTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { newStatus, newPosition, boardId } = req.body;

    const updateData = {};
    if (newStatus) updateData.status = newStatus;
    if (newPosition !== undefined) updateData.position = newPosition;
    if (boardId) updateData.boardId = boardId;

    await db.update(tickets).set(updateData).where(eq(tickets.id, ticketId));

    // Return the updated ticket
    const [updatedTicket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!updatedTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error moving ticket:', error);
    res.status(500).json({ error: 'Failed to move ticket' });
  }
};

// Move task
export const moveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { columnId, position } = req.body;

    await db.update(tasks).set({ columnId, position }).where(eq(tasks.id, taskId));

    res.json({ message: 'Task moved successfully' });
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ error: 'Failed to move task' });
  }
};

// Add column
export const addColumn = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { name, description, color, position, wipLimit } = req.body;

    await db.insert(kanbanColumns).values({
      boardId,
      name,
      description,
      color,
      position,
      wipLimit
    });

    const [column] = await db.select().from(kanbanColumns).where(eq(kanbanColumns.name, name)).limit(1);

    res.status(201).json(column);
  } catch (error) {
    console.error('Error adding column:', error);
    res.status(500).json({ error: 'Failed to add column' });
  }
};

// Update column
export const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { name, description, color, wipLimit } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;
    if (wipLimit !== undefined) updateData.wipLimit = wipLimit;

    await db.update(kanbanColumns).set(updateData).where(eq(kanbanColumns.id, columnId));
    const [updatedColumn] = await db.select().from(kanbanColumns).where(eq(kanbanColumns.id, columnId)).limit(1);

    res.json(updatedColumn);
  } catch (error) {
    console.error('Error updating column:', error);
    res.status(500).json({ error: 'Failed to update column' });
  }
};

// Delete column
export const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;

    await db.delete(kanbanColumns).where(eq(kanbanColumns.id, columnId));

    res.json({ message: 'Column deleted successfully' });
  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ error: 'Failed to delete column' });
  }
};

// Get board analytics
export const getBoardAnalytics = async (req, res) => {
  try {
    const { boardId } = req.params;

    const [ticketCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.boardId, boardId));
    const [taskCount] = await db.select({ count: count() }).from(tasks).where(eq(tasks.boardId, boardId));

    res.json({
      ticketCount: ticketCount.count,
      taskCount: taskCount.count
    });
  } catch (error) {
    console.error('Error fetching board analytics:', error);
    res.status(500).json({ error: 'Failed to fetch board analytics' });
  }
};
