import { z } from 'zod';

export const schedulerSchema = z.object({
  intervalMinutes: z
    .number({ error: 'Must be a number' })
    .int('Must be a whole number')
    .min(1, 'Minimum 1 minute')
    .max(1440, 'Maximum 1440 minutes (24 hours)'),
});
export type SchedulerFormValues = z.infer<typeof schedulerSchema>;

export const slaSchema = z.object({
  slaUrgentHours: z.number().int().min(1, 'Min 1 hour'),
  slaHighHours:   z.number().int().min(1, 'Min 1 hour'),
  slaMediumHours: z.number().int().min(1, 'Min 1 hour'),
  slaLowHours:    z.number().int().min(1, 'Min 1 hour'),
}).refine(
  (d) => d.slaUrgentHours <= d.slaHighHours,
  { message: 'URGENT must be ≤ HIGH', path: ['slaUrgentHours'] }
).refine(
  (d) => d.slaHighHours <= d.slaMediumHours,
  { message: 'HIGH must be ≤ MEDIUM', path: ['slaHighHours'] }
).refine(
  (d) => d.slaMediumHours <= d.slaLowHours,
  { message: 'MEDIUM must be ≤ LOW', path: ['slaMediumHours'] }
);
export type SlaFormValues = z.infer<typeof slaSchema>;
