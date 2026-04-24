import { z } from 'zod';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const createTemplateSchema = z.object({
  name:           z.string().trim().min(1, 'name is required').max(150),
  description:    z.string().trim().max(1000).nullable().optional(),
  priority:       z.enum(PRIORITIES).optional(),
  estimatedHours: z.number().positive().nullable().optional(),
});

export const updateTemplateSchema = z.object({
  name:           z.string().trim().min(1).max(150).optional(),
  description:    z.string().trim().max(1000).nullable().optional(),
  priority:       z.enum(PRIORITIES).optional(),
  estimatedHours: z.number().positive().nullable().optional(),
});
