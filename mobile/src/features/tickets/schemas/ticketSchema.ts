import { z } from 'zod';
import type { TFunction } from 'i18next';

export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TicketPriorityValue = typeof TICKET_PRIORITIES[number];

export const TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'PROGRAMMING',
  'UNDER_DEVELOPMENT',
  'CODE_REVIEW',
  'TESTING',
  'RESOLVED',
  'CLOSED',
] as const;
export type TicketStatusValue = typeof TICKET_STATUSES[number];

/**
 * Returns the ticket form schema with translated error messages.
 * Covers all fields accepted by POST/PUT /tickets.
 *
 * @param t         - i18next translation function
 * @param isEdit    - When true, status field is included (edit mode only)
 */
export const createTicketFormSchema = (t: TFunction, isEdit = false) =>
  z.object({
    // ── Required ──────────────────────────────────────────────────────────────
    title: z.string().trim()
      .min(2,   t('validation.minLength', { field: t('tickets.form.title'),       min: 2   }))
      .max(120, t('validation.maxLength', { field: t('tickets.form.title'),       max: 120 })),

    description: z.string().trim()
      .min(1,   t('validation.required',  { field: t('tickets.form.description') }))
      .max(500, t('validation.maxLength', { field: t('tickets.form.description'), max: 500 })),

    priority: z.enum(TICKET_PRIORITIES, {
      error: t('validation.required', { field: t('tickets.form.priority') }),
    }),

    // ── Edit-mode only ────────────────────────────────────────────────────────
    status: isEdit
      ? z.enum(TICKET_STATUSES, {
          error: t('validation.required', { field: t('tickets.form.status') }),
        }).optional()
      : z.enum(TICKET_STATUSES).optional(),

    // ── Optional relations ────────────────────────────────────────────────────
    assignedToId:  z.string().uuid().nullable().optional(),
    customerId:    z.string().uuid().nullable().optional(),
    applicationId: z.string().uuid().nullable().optional(),

    // ── Optional scheduling ───────────────────────────────────────────────────
    /** ISO date string (YYYY-MM-DD) from AppDatePicker */
    dueDate: z.string().nullable().optional(),

    /** Coerced from text input — HTML inputs return strings */
    estimatedHours: z.number().min(0).max(9999).nullable().optional(),
  });

export type TicketFormValues = z.infer<ReturnType<typeof createTicketFormSchema>>;
