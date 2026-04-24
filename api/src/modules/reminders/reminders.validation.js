import { z } from 'zod';

const VALID_DATE_FORMATS = [
  'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd',
  'dd-MM-yyyy', 'MM-dd-yyyy', 'd MMM yyyy', 'MMM d, yyyy',
];

export const updateReminderSettingsSchema = z.object({
  reminderEnabled:  z.boolean().optional(),
  reminderInterval: z.number().int().positive().optional(),
});

export const updateEscalationSettingsSchema = z.object({
  intervalMinutes: z.coerce.number().int().min(1, 'intervalMinutes must be a positive integer'),
});

export const updateSlaSettingsSchema = z.object({
  slaUrgentHours:  z.coerce.number().int().positive().optional(),
  slaHighHours:    z.coerce.number().int().positive().optional(),
  slaMediumHours:  z.coerce.number().int().positive().optional(),
  slaLowHours:     z.coerce.number().int().positive().optional(),
});

export const updateEpicAutoCloseSchema = z.object({
  epicAutoClose: z.boolean(),
});

export const updateDateFormatSchema = z.object({
  dateFormat: z.enum(VALID_DATE_FORMATS),
});
