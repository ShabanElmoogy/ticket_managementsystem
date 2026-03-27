import { z } from 'zod';

const columnInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  wipLimit: z.number().int().positive().nullable().optional(),
});

export const createBoardSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  type: z.enum(['TICKETS', 'TASKS']).optional(),
  isDefault: z.boolean().optional(),
  columns: z.array(columnInput).optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(['TICKETS', 'TASKS']).optional(),
});

export const addColumnSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  color: z.string().optional(),
  position: z.number().int().min(0).optional(),
  wipLimit: z.number().int().positive().nullable().optional(),
});

export const updateColumnSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  color: z.string().optional(),
  wipLimit: z.number().int().positive().nullable().optional(),
});

export const moveTicketSchema = z.object({
  newStatus: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  newPosition: z.number().int().min(0).optional(),
  boardId: z.string().uuid().optional(),
});

export const moveTaskSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
});
