import { z } from 'zod';

const columnInput = z.object({
  name:        z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  color:       z.string().trim().max(20).optional(),
  wipLimit:    z.number().int().positive().nullable().optional(),
});

export const createBoardSchema = z.object({
  name:        z.string().trim().min(1, 'name is required').max(150),
  description: z.string().trim().max(500).nullable().optional(),
  type:        z.enum(['TICKETS', 'TASKS']).optional(),
  isDefault:   z.boolean().optional(),
  columns:     z.array(columnInput).optional(),
});

export const updateBoardSchema = z.object({
  name:        z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  type:        z.enum(['TICKETS', 'TASKS']).optional(),
});

export const addColumnSchema = z.object({
  name:        z.string().trim().min(1, 'name is required').max(100),
  description: z.string().trim().max(500).nullable().optional(),
  color:       z.string().trim().max(20).optional(),
  position:    z.number().int().min(0).optional(),
  wipLimit:    z.number().int().positive().nullable().optional(),
});

export const updateColumnSchema = z.object({
  name:        z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  color:       z.string().trim().max(20).optional(),
  wipLimit:    z.number().int().positive().nullable().optional(),
});

export const moveTicketSchema = z.object({
  newStatus:   z.enum(['OPEN', 'IN_PROGRESS', 'PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'RESOLVED', 'CLOSED']).optional(),
  newPosition: z.number().int().min(0).optional(),
  boardId:     z.string().uuid().optional(),
});

export const moveTaskSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
});
