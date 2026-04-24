import { z } from 'zod';

// Hex colour or CSS colour name — basic guard, not exhaustive
const colorString = z.string().trim().min(1).max(30).optional();

export const createLabelSchema = z.object({
  name:        z.string().trim().min(1, 'name is required').max(100),
  color:       colorString,
  description: z.string().trim().max(500).nullable().optional(),
});

export const updateLabelSchema = z.object({
  name:        z.string().trim().min(1).max(100).optional(),
  color:       colorString,
  description: z.string().trim().max(500).nullable().optional(),
});

export const addLabelToTicketSchema = z.object({
  ticketId: z.string().uuid(),
  labelId:  z.string().uuid(),
});
