import { z } from 'zod';

export const createLabelSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  description: z.string().nullable().optional(),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  description: z.string().nullable().optional(),
});

export const addLabelToTicketSchema = z.object({
  ticketId: z.string().uuid(),
  labelId: z.string().uuid(),
});
