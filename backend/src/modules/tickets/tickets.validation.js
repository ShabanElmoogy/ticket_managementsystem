import { z } from 'zod';

const ticketStatus = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
const ticketPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: ticketPriority.optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  applicationId: z.string().uuid().nullable().optional(),
  boardId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  labels: z.array(z.string().uuid()).optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: ticketStatus.optional(),
  priority: ticketPriority.optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  applicationId: z.string().uuid().nullable().optional(),
  boardId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  actualHours: z.number().positive().nullable().optional(),
  labels: z.array(z.string().uuid()).optional(),
});

export const ticketQuerySchema = z.object({
  status: ticketStatus.optional(),
  priority: ticketPriority.optional(),
  assignedTo: z.string().uuid().optional(),
});
