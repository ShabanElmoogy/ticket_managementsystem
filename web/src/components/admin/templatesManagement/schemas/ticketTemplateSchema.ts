import { z } from 'zod';

export const ticketTemplateSchema = z.object({
  name:           z.string().trim().min(1, 'Name is required').max(100),
  description:    z.string().trim().max(500).optional().or(z.literal('')),
  priority:       z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  estimatedHours: z.coerce.number().min(0).max(999).nullable().optional(),
});

export type TicketTemplateFormValues = z.infer<typeof ticketTemplateSchema>;
