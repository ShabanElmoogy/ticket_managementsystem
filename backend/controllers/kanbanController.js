import { PrismaClient } from '@prisma/client';
import { createNotification } from '../utils/notificationUtils.js';
import { logActivity } from '../utils/activityUtils.js';

const prisma = new PrismaClient();

// Get all boards with columns and tickets/tasks
export const getAllBoards = async (req, res) => {
  try {
    console.log('=== GET ALL BOARDS REQUEST START ===');
    
    const boards = await prisma.kanbanBoard.findMany({
      where: { isActive: true },
      include: {
        columns: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
        },
        permissions: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    console.log('Fetched boards from database:', boards.length);

    // Try to get tasks, but handle gracefully if Task model doesn't exist yet
    let allTasks = [];
    try {
      allTasks = await prisma.task.findMany({
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          board: { select: { id: true, name: true } },
          column: { select: { id: true, name: true, color: true } }
        },
        orderBy: { position: 'asc' }
      });
      console.log('Fetched tasks from database:', allTasks.length);
    } catch (taskError) {
      console.log('Tasks not available yet (this is normal if migration not run):', taskError.message);
    }

    // Get all tickets
    const allTickets = await prisma.ticket.findMany({
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true } },
        application: { select: { id: true, name: true } },
        labels: {
          include: { label: true }
        },
        _count: { select: { comments: true } }
      },
      orderBy: { position: 'asc' }
    });

    console.log('Fetched tickets from database:', allTickets.length);

    // Assign tickets/tasks to boards based on board type (if type field exists)
    const boardsWithItems = boards.map(board => {
      // Check if board has type field and if it's TASKS
      if (board.type === 'TASKS') {
        const boardTasks = allTasks.filter(task => task.boardId === board.id);
        return {
          ...board,
          tasks: boardTasks,
          tickets: [] // Empty for task boards
        };
      } else {
        // Default to tickets (for TICKETS type or if type field doesn't exist)
        const boardTickets = allTickets.filter(ticket => {
          if (ticket.boardId === board.id) {
            return true;
          }
          // If ticket has no boardId and this is the first board or default board, include it
          if (!ticket.boardId && (board.isDefault || boards.indexOf(board) === 0)) {
            return true;
          }
          return false;
        });

        return {
          ...board,
          tickets: boardTickets,
          tasks: [] // Empty for ticket boards
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
    
    const board = await prisma.kanbanBoard.findUnique({
      where: { id },
      include: {
        columns: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
        },
        permissions: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    let boardWithItems;

    if (board.type === 'TASKS') {
      // Get all tasks for this board
      let boardTasks = [];
      try {
        boardTasks = await prisma.task.findMany({
          where: { boardId: board.id },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            board: { select: { id: true, name: true } },
            column: { select: { id: true, name: true, color: true } }
          },
          orderBy: { position: 'asc' }
        });
      } catch (taskError) {
        console.log('Tasks not available yet:', taskError.message);
      }

      boardWithItems = {
        ...board,
        tasks: boardTasks,
        tickets: []
      };
    } else {
      // Get all tickets for this board (including those without boardId if this is default/first board)
      const allTickets = await prisma.ticket.findMany({
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          customer: { select: { id: true, name: true } },
          application: { select: { id: true, name: true } },
          labels: {
            include: { label: true }
          },
          _count: { select: { comments: true } }
        },
        orderBy: { position: 'asc' }
      });

      // Filter tickets for this board
      const boardTickets = allTickets.filter(ticket => {
        if (ticket.boardId === board.id) {
          return true;
        }
        // If ticket has no boardId and this is the default board, include it
        if (!ticket.boardId && board.isDefault) {
          return true;
        }
        return false;
      });

      boardWithItems = {
        ...board,
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

    // Normalize the type value to match BoardType enum
    let boardType = 'TICKETS'; // Default
    if (type) {
      const normalizedType = type.toString().toUpperCase();
      if (normalizedType === 'TASKS' || normalizedType === 'TASK') {
        boardType = 'TASKS';
      } else if (normalizedType === 'TICKETS' || normalizedType === 'TICKET') {
        boardType = 'TICKETS';
      }
    }

    console.log('Normalized board type:', boardType);

    const board = await prisma.kanbanBoard.create({
      data: {
        name,
        description,
        type: boardType,
        isDefault: isDefault || false,
        columns: {
          create: columns?.map((col, index) => ({
            name: col.name,
            description: col.description,
            color: col.color,
            position: index,
            wipLimit: col.wipLimit
          })) || [
            { name: 'To Do', position: 0, color: '#e3f2fd' },
            { name: 'In Progress', position: 1, color: '#fff3e0' },
            { name: 'Review', position: 2, color: '#f3e5f5' },
            { name: 'Done', position: 3, color: '#e8f5e8' }
          ]
        },
        permissions: userId !== 'test-user-id' ? {
          create: {
            userId,
            role: 'ADMIN'
          }
        } : undefined
      },
      include: {
        columns: { orderBy: { position: 'asc' } },
        permissions: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    console.log('Board created successfully:', board.id);
    res.status(201).json(board);
  } catch (error) {
    console.error('=== CREATE BOARD REQUEST ERROR ===');
    console.error('Error creating board:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code) {
      console.error('Prisma error code:', error.code);
    }
    
    res.status(500).json({ 
      error: 'Failed to create board',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
};

// Update board
export const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) {
      // Normalize type value
      const normalizedType = type.toString().toUpperCase();
      updateData.type = (normalizedType === 'TASKS' || normalizedType === 'TASK') ? 'TASKS' : 'TICKETS';
    }

    const board = await prisma.kanbanBoard.update({
      where: { id },
      data: updateData,
      include: {
        columns: { orderBy: { position: 'asc' } },
        permissions: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    res.json(board);
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ error: 'Failed to update board' });
  }
};

// Delete board
export const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.kanbanBoard.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
};

// Move ticket between columns/positions
export const moveTicket = async (req, res) => {
  console.log('=== MOVE TICKET REQUEST START ===');
  console.log('Request headers:', req.headers);
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  console.log('Authorization header:', req.headers.authorization);
  
  try {
    const { ticketId } = req.params;
    const { newStatus, newPosition, boardId } = req.body;
    const userId = req.user?.id || 'test-user-id';

    console.log('Using userId:', userId);

    if (!ticketId) {
      console.error('No ticket ID provided');
      return res.status(400).json({ error: 'Ticket ID is required' });
    }

    console.log('Move ticket request:', { ticketId, newStatus, newPosition, boardId, userId });

    // Get current ticket - simplified query first
    console.log('Fetching current ticket...');
    const currentTicket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!currentTicket) {
      console.error('Ticket not found:', ticketId);
      return res.status(404).json({ error: 'Ticket not found' });
    }

    console.log('Current ticket found:', {
      id: currentTicket.id,
      title: currentTicket.title,
      status: currentTicket.status,
      position: currentTicket.position
    });

    // Map column names to valid status values
    const statusMapping = {
      'OPEN': 'OPEN',
      'IN_PROGRESS': 'IN_PROGRESS', 
      'RESOLVED': 'RESOLVED',
      'CLOSED': 'CLOSED'
    };

    // Get the mapped status or use the original if it's already valid
    const mappedStatus = statusMapping[newStatus] || newStatus || currentTicket.status;
    
    console.log('Status mapping:', { original: newStatus, mapped: mappedStatus });

    // Validate that the mapped status is a valid enum value
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(mappedStatus)) {
      console.error('Invalid status:', mappedStatus);
      return res.status(400).json({ error: `Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Update ticket - minimal update first
    console.log('Updating ticket...');
    const updateData = {
      status: mappedStatus,
      position: newPosition !== undefined ? newPosition : currentTicket.position
    };

    if (boardId && boardId !== currentTicket.boardId) {
      updateData.boardId = boardId;
    }

    console.log('Update data:', updateData);

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData
    });

    console.log('Ticket updated successfully:', {
      id: updatedTicket.id,
      status: updatedTicket.status,
      position: updatedTicket.position
    });

    // Return minimal response first to test
    console.log('=== MOVE TICKET REQUEST SUCCESS ===');
    res.json({
      id: updatedTicket.id,
      status: updatedTicket.status,
      position: updatedTicket.position,
      title: updatedTicket.title
    });

  } catch (error) {
    console.error('=== MOVE TICKET REQUEST ERROR ===');
    console.error('Error moving ticket:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if it's a Prisma error
    if (error.code) {
      console.error('Prisma error code:', error.code);
    }
    
    res.status(500).json({ 
      error: 'Failed to move ticket',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
};

// Move task between columns/positions
export const moveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newStatus, newPosition, columnId } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    const currentTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!currentTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Map column names to valid task status values
    const statusMapping = {
      'TODO': 'TODO',
      'IN_PROGRESS': 'IN_PROGRESS', 
      'REVIEW': 'REVIEW',
      'DONE': 'DONE'
    };

    const mappedStatus = statusMapping[newStatus] || newStatus || currentTask.status;
    
    // Validate that the mapped status is a valid enum value
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    if (!validStatuses.includes(mappedStatus)) {
      return res.status(400).json({ error: `Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updateData = {
      status: mappedStatus,
      position: newPosition !== undefined ? newPosition : currentTask.position
    };

    if (columnId && columnId !== currentTask.columnId) {
      updateData.columnId = columnId;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        board: { select: { id: true, name: true } },
        column: { select: { id: true, name: true, color: true } }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ 
      error: 'Failed to move task',
      details: error.message
    });
  }
};

// Add column to board
export const addColumn = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { name, description, color, wipLimit } = req.body;

    // Get the highest position
    const lastColumn = await prisma.kanbanColumn.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' }
    });

    const position = lastColumn ? lastColumn.position + 1 : 0;

    const column = await prisma.kanbanColumn.create({
      data: {
        name,
        description,
        color,
        wipLimit,
        position,
        boardId
      }
    });

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

    const column = await prisma.kanbanColumn.update({
      where: { id: columnId },
      data: { name, description, color, wipLimit }
    });

    res.json(column);
  } catch (error) {
    console.error('Error updating column:', error);
    res.status(500).json({ error: 'Failed to update column' });
  }
};

// Delete column
export const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;

    await prisma.kanbanColumn.update({
      where: { id: columnId },
      data: { isActive: false }
    });

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
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get the board to check its type
    const board = await prisma.kanbanBoard.findUnique({
      where: { id: boardId },
      select: { type: true }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.type === 'TASKS') {
      // Analytics for task boards
      try {
        const tasksByStatus = await prisma.task.groupBy({
          by: ['status'],
          where: {
            boardId,
            ...dateFilter
          },
          _count: { id: true }
        });

        const completedTasks = await prisma.task.findMany({
          where: {
            boardId,
            status: 'DONE',
            ...dateFilter
          },
          select: {
            createdAt: true,
            updatedAt: true
          }
        });

        const avgCompletionTime = completedTasks.length > 0
          ? completedTasks.reduce((sum, task) => {
              const diff = task.updatedAt.getTime() - task.createdAt.getTime();
              return sum + diff;
            }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
          : 0;

        const totalTasks = await prisma.task.count({
          where: { boardId, ...dateFilter }
        });

        const completedCount = tasksByStatus.find(s => s.status === 'DONE')?._count.id || 0;
        const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

        res.json({
          tasksByStatus,
          avgCompletionTime: Math.round(avgCompletionTime * 100) / 100,
          totalTasks,
          completedTasks: completedCount,
          completionRate: Math.round(completionRate * 100) / 100
        });
      } catch (taskError) {
        console.log('Task analytics not available:', taskError.message);
        res.json({
          tasksByStatus: [],
          avgCompletionTime: 0,
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0
        });
      }
    } else {
      // Analytics for ticket boards
      const ticketsByStatus = await prisma.ticket.groupBy({
        by: ['status'],
        where: {
          boardId,
          ...dateFilter
        },
        _count: { id: true }
      });

      const ticketsByPriority = await prisma.ticket.groupBy({
        by: ['priority'],
        where: {
          boardId,
          ...dateFilter
        },
        _count: { id: true }
      });

      const completedTickets = await prisma.ticket.findMany({
        where: {
          boardId,
          status: 'CLOSED',
          ...dateFilter
        },
        select: {
          createdAt: true,
          updatedAt: true
        }
      });

      const avgCompletionTime = completedTickets.length > 0
        ? completedTickets.reduce((sum, ticket) => {
            const diff = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
            return sum + diff;
          }, 0) / completedTickets.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      const totalTickets = await prisma.ticket.count({
        where: { boardId, ...dateFilter }
      });

      const completedCount = ticketsByStatus.find(s => s.status === 'CLOSED')?._count.id || 0;
      const completionRate = totalTickets > 0 ? (completedCount / totalTickets) * 100 : 0;

      res.json({
        ticketsByStatus,
        ticketsByPriority,
        avgCompletionTime: Math.round(avgCompletionTime * 100) / 100,
        totalTickets,
        completedTickets: completedCount,
        completionRate: Math.round(completionRate * 100) / 100
      });
    }
  } catch (error) {
    console.error('Error fetching board analytics:', error);
    res.status(500).json({ error: 'Failed to fetch board analytics' });
  }
};