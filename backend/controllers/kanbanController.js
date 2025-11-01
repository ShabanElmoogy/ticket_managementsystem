import { db } from '../config/database.js';
import { kanbanBoards, kanbanColumns, tasks, tickets, users, customers, applications, labels, ticketLabels, comments, boardPermissions } from '../drizzle/schema.js';
import { eq, and, asc, count, inArray } from 'drizzle-orm';
import { createNotification } from '../utils/notificationUtils.js';
import { logActivity } from '../utils/activityUtils.js';

// Get all boards with columns and tickets/tasks
export const getAllBoards = async (req, res) => {
  try {
    console.log('=== GET ALL BOARDS REQUEST START ===');
    
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

    console.log('Fetched boards from database:', boards.length);

    // Try to get tasks
    let allTasks = [];
    try {
      allTasks = await db
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
        .orderBy(asc(tasks.position));
      console.log('Fetched tasks from database:', allTasks.length);
    } catch (taskError) {
      console.log('Tasks not available yet:', taskError.message);
    }

    // Get all tickets with related data
    const allTickets = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        position: tickets.position,
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
      .orderBy(asc(tickets.position));

    console.log('Fetched tickets from database:', allTickets.length);

    // Assign tickets/tasks to boards based on board type
    const boardsWithItems = boards.map(board => {
      const boardColumns = columns.filter(col => col.boardId === board.id);
      const boardPermissions = permissions.filter(perm => perm.boardId === board.id);
      
      if (board.type === 'TASKS') {
        const boardTasks = allTasks.filter(task => task.boardId === board.id);
        return {
          ...board,
          columns: boardColumns,
          permissions: boardPermissions,
          tasks: boardTasks,
          tickets: []
        };
      } else {
        const boardTickets = allTickets.filter(ticket => {
          if (ticket.boardId === board.id) {
            return true;
          }
          if (!ticket.boardId && (board.isDefault || boards.indexOf(board) === 0)) {
            return true;
          }
          return false;
        });

        return {
          ...board,
          columns: boardColumns,
          permissions: boardPermissions,
          tickets: boardTickets,
          tasks: []
        };
      }
    });

    console.log('Returning boards with items:', boardsWithItems.length);
    res.json(boardsWithItems);
  } catch (error) {
    console.error('=== GET ALL BOARDS REQUEST ERROR ===');
    console.error('Error fetching boards:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
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
    const boardPermissions = await db
      .select({
        userId: boardPermissions.userId,
        role: boardPermissions.role,
        userName: users.name,
        userEmail: users.email
      })
      .from(boardPermissions)
      .innerJoin(users, eq(users.id, boardPermissions.userId))
      .where(eq(boardPermissions.boardId, id));

    let boardWithItems;

    if (board.type === 'TASKS') {
      let boardTasks = [];
      try {
        boardTasks = await db
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
      } catch (taskError) {
        console.log('Tasks not available yet:', taskError.message);
      }

      boardWithItems = {
        ...board,
        columns: boardColumns,
        permissions: boardPermissions,
        tasks: boardTasks,
        tickets: []
      };
    } else {
      // Get all tickets
      const allTickets = await db
        .select({
          id: tickets.id,
          title: tickets.title,
          description: tickets.description,
          status: tickets.status,
          priority: tickets.priority,
          position: tickets.position,
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
        .orderBy(asc(tickets.position));

      // Filter tickets for this board
      const boardTickets = allTickets.filter(ticket => {
        if (ticket.boardId === id) {
          return true;
        }
        if (!ticket.boardId && board.isDefault) {
          return true;
        }
        return false;
      });

      boardWithItems = {
        ...board,
        columns: boardColumns,
        permissions: boardPermissions,
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
  console.log('User:', req.user);
  
  try {
    const { name, description, columns, type, isDefault } = req.body;
    const userId = req.user?.id || 'test-user-id';

    console.log('Creating board with userId:', userId);
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

    // Create permissions if user is not test user
    let createdPermissions = [];
    if (userId !== 'test-user-id') {
      await db.insert(boardPermissions).values({
        boardId: board.id,
        userId,
        role: 'ADMIN'
      });
      createdPermissions = await db.select().from(boardPermissions).where(eq(boardPermissions.boardId, board.id));
    }

    const boardWithRelations = {
      ...board,
      columns: createdColumns,
      permissions: createdPermissions
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
    const { boardId, position } = req.body;

    await db.update(tickets).set({ boardId, position }).where(eq(tickets.id, ticketId));

    res.json({ message: 'Ticket moved successfully' });
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