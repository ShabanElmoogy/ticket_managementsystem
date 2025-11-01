import { db } from '../config/database.js';
import { tasks, users, kanbanBoards, kanbanColumns } from '../drizzle/schema.js';
import { eq, desc, asc, and } from 'drizzle-orm';

// Get all tasks for a board
export const getTasks = async (req, res) => {
  try {
    const { boardId } = req.query;
    
    const tasksData = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        boardId: tasks.boardId,
        columnId: tasks.columnId,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
        status: tasks.status,
        position: tasks.position,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assignee: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        board: {
          id: kanbanBoards.id,
          name: kanbanBoards.name,
          type: kanbanBoards.type
        },
        column: {
          id: kanbanColumns.id,
          name: kanbanColumns.name,
          color: kanbanColumns.color
        }
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(kanbanBoards, eq(tasks.boardId, kanbanBoards.id))
      .leftJoin(kanbanColumns, eq(tasks.columnId, kanbanColumns.id))
      .where(boardId ? eq(tasks.boardId, boardId) : undefined)
      .orderBy(asc(tasks.position), desc(tasks.createdAt));

    res.json(tasksData);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get a single task
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        boardId: tasks.boardId,
        columnId: tasks.columnId,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
        status: tasks.status,
        position: tasks.position,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assignee: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        board: {
          id: kanbanBoards.id,
          name: kanbanBoards.name,
          type: kanbanBoards.type
        },
        column: {
          id: kanbanColumns.id,
          name: kanbanColumns.name,
          color: kanbanColumns.color
        }
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(kanbanBoards, eq(tasks.boardId, kanbanBoards.id))
      .leftJoin(kanbanColumns, eq(tasks.columnId, kanbanColumns.id))
      .where(eq(tasks.id, id))
      .limit(1);

    if (!task.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task[0]);
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
    const board = await db
      .select()
      .from(kanbanBoards)
      .where(eq(kanbanBoards.id, boardId))
      .limit(1);

    if (!board.length) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board[0].type !== 'TASKS') {
      return res.status(400).json({ error: 'Board must be of type TASKS' });
    }

    // Verify column exists and belongs to the board
    const column = await db
      .select()
      .from(kanbanColumns)
      .where(and(eq(kanbanColumns.id, columnId), eq(kanbanColumns.boardId, boardId)))
      .limit(1);

    if (!column.length) {
      return res.status(404).json({ error: 'Column not found or does not belong to this board' });
    }

    // Get the next position for this column
    const lastTask = await db
      .select({ position: tasks.position })
      .from(tasks)
      .where(eq(tasks.columnId, columnId))
      .orderBy(desc(tasks.position))
      .limit(1);

    const position = lastTask.length ? lastTask[0].position + 1 : 0;

    const [newTask] = await db
      .insert(tasks)
      .values({
        title,
        description: description || '',
        boardId,
        columnId,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'TODO',
        position
      })
      .returning();

    const task = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        boardId: tasks.boardId,
        columnId: tasks.columnId,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
        status: tasks.status,
        position: tasks.position,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assignee: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        board: {
          id: kanbanBoards.id,
          name: kanbanBoards.name,
          type: kanbanBoards.type
        },
        column: {
          id: kanbanColumns.id,
          name: kanbanColumns.name,
          color: kanbanColumns.color
        }
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(kanbanBoards, eq(tasks.boardId, kanbanBoards.id))
      .leftJoin(kanbanColumns, eq(tasks.columnId, kanbanColumns.id))
      .where(eq(tasks.id, newTask.id))
      .limit(1);

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

    const existingTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (!existingTask.length) {
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

    await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id));

    const task = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        boardId: tasks.boardId,
        columnId: tasks.columnId,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
        status: tasks.status,
        position: tasks.position,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assignee: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        board: {
          id: kanbanBoards.id,
          name: kanbanBoards.name,
          type: kanbanBoards.type
        },
        column: {
          id: kanbanColumns.id,
          name: kanbanColumns.name,
          color: kanbanColumns.color
        }
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(kanbanBoards, eq(tasks.boardId, kanbanBoards.id))
      .leftJoin(kanbanColumns, eq(tasks.columnId, kanbanColumns.id))
      .where(eq(tasks.id, id))
      .limit(1);

    res.json(task[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (!existingTask.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db
      .delete(tasks)
      .where(eq(tasks.id, id));

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

    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (!task.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task position and column
    await db
      .update(tasks)
      .set({
        columnId,
        position,
        status: status || task[0].status
      })
      .where(eq(tasks.id, id));

    const updatedTask = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        boardId: tasks.boardId,
        columnId: tasks.columnId,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
        status: tasks.status,
        position: tasks.position,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assignee: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        board: {
          id: kanbanBoards.id,
          name: kanbanBoards.name,
          type: kanbanBoards.type
        },
        column: {
          id: kanbanColumns.id,
          name: kanbanColumns.name,
          color: kanbanColumns.color
        }
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(kanbanBoards, eq(tasks.boardId, kanbanBoards.id))
      .leftJoin(kanbanColumns, eq(tasks.columnId, kanbanColumns.id))
      .where(eq(tasks.id, id))
      .limit(1);

    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ error: 'Failed to move task' });
  }
};