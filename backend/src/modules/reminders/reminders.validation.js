import { z } from 'zod';

export const updateReminderSettingsSchema = z.object({
  reminderEnabled: z.boolean().optional(),
  reminderInterval: z.number().int().positive().optional(),
});
