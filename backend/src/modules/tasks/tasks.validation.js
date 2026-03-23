import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  boardId: z.string().uuid(),
  columnId: z.string().uuid(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.string().optional(),
  columnId: z.string().uuid().nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export const moveTaskSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
  status: z.string().optional(),
});
