import { z } from 'zod';

const ticketStatus   = z.enum(['OPEN', 'IN_PROGRESS', 'PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'RESOLVED', 'CLOSED']);
const ticketPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const uuidOpt        = z.string().uuid().nullable().optional();

export const createTicketSchema = z.object({
  title:          z.string().trim().min(1, 'title is required').max(255),
  description:    z.string().trim().max(10000).optional(),
  priority:       ticketPriority.optional(),
  assignedToId:   uuidOpt,
  customerId:     uuidOpt,
  applicationId:  uuidOpt,
  boardId:        uuidOpt,
  dueDate:        z.string().datetime().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  labels:         z.array(z.string().uuid()).optional(),
});

export const updateTicketSchema = z.object({
  title:          z.string().trim().min(1).max(255).optional(),
  description:    z.string().trim().max(10000).nullable().optional(),
  status:         ticketStatus.optional(),
  priority:       ticketPriority.optional(),
  assignedToId:   uuidOpt,
  customerId:     uuidOpt,
  applicationId:  uuidOpt,
  boardId:        uuidOpt,
  dueDate:        z.string().datetime().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  actualHours:    z.number().positive().nullable().optional(),
  labels:         z.array(z.string().uuid()).optional(),
});

export const ticketQuerySchema = z.object({
  status:        ticketStatus.optional(),
  priority:      ticketPriority.optional(),
  assignedTo:    z.union([z.string().uuid(), z.literal('none')]).optional(),
  deleted:       z.enum(['true', 'false']).optional(),
  search:        z.string().trim().max(200).optional(),
  customerId:    z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  userId:        z.string().uuid().optional(),
});

export const bulkUpdateStatusSchema = z.object({
  ids:    z.array(z.string().uuid()).min(1, 'ids must be a non-empty array'),
  status: ticketStatus,
});

export const reassignTicketSchema = z.object({
  assignedToId: z.string().uuid(),
});
