import { z } from 'zod';
import { Role } from '../../constants/roles.js';

const userRole = z.enum(Object.values(Role));

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: userRole.optional(),
  phone: z.string().optional(),
  whatsappNotifications: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  // Empty string = "no change" — only validate min(6) when a non-empty value is provided
  password: z.string().refine((v) => !v || v.length >= 6, { message: 'Password must be at least 6 characters' }).optional(),
  role: userRole.optional(),
  phone: z.string().nullable().optional(),
  whatsappNotifications: z.boolean().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderInterval: z.number().int().positive().optional(),
});

export const updateOwnProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderInterval: z.number().int().positive().optional(),
});
