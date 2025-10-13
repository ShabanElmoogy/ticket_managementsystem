import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all tasks for a board
export const getTasks = async (req, res) => {
  try {
    const { boardId } = req.query;
    
    const tasks = await prisma.task.findMany({
      where: boardId ? { boardId } : {},
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        board: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get a single task
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        board: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, boardId, columnId, assigneeId, dueDate, status } = req.body;

    if (!title || !boardId || !columnId) {
      return res.status(400).json({ error: 'Title, boardId, and columnId are required' });
    }

    // Verify board exists and is of type TASKS
    const board = await prisma.kanbanBoard.findUnique({
      where: { id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.type !== 'TASKS') {
      return res.status(400).json({ error: 'Board must be of type TASKS' });
    }

    // Verify column exists and belongs to the board
    const column = await prisma.kanbanColumn.findFirst({
      where: {
        id: columnId,
        boardId: boardId
      }
    });

    if (!column) {
      return res.status(404).json({ error: 'Column not found or does not belong to this board' });
    }

    // Get the next position for this column
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' }
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        boardId,
        columnId,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'TODO',
        position
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        board: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigneeId, dueDate, status, columnId, position } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) updateData.status = status;
    if (columnId !== undefined) updateData.columnId = columnId;
    if (position !== undefined) updateData.position = position;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        board: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Move task to different column/position
export const moveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { columnId, position, status } = req.body;

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task position and column
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        columnId,
        position,
        status: status || task.status
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        board: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ error: 'Failed to move task' });
  }
};