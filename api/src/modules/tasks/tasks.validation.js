import { z } from 'zod';

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

export const createTaskSchema = z.object({
  title:       z.string().trim().min(1, 'title is required').max(255),
  description: z.string().trim().max(2000).optional(),
  boardId:     z.string().uuid(),
  columnId:    z.string().uuid(),
  assigneeId:  z.string().uuid().nullable().optional(),
  dueDate:     z.string().datetime().nullable().optional(),
  status:      z.enum(TASK_STATUSES).optional(),
});

export const updateTaskSchema = z.object({
  title:       z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  assigneeId:  z.string().uuid().nullable().optional(),
  dueDate:     z.string().datetime().nullable().optional(),
  status:      z.enum(TASK_STATUSES).optional(),
  columnId:    z.string().uuid().nullable().optional(),
  position:    z.number().int().min(0).optional(),
});

export const moveTaskSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
  status:   z.enum(TASK_STATUSES).optional(),
});
