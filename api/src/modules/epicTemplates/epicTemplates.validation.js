import { z } from 'zod';

// ── Feature / step shapes (used inside template body) ─────────────────────────

const stepSchema = z.object({
  title:       z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).nullable().optional(),
});

const featureSchema = z.object({
  title:       z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).nullable().optional(),
  steps:       z.array(stepSchema).optional(),
});

// ── Template CRUD ─────────────────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name:        z.string().trim().min(1, 'name is required').max(150),
  description: z.string().trim().max(1000).nullable().optional(),
  category:    z.string().trim().max(100).optional(),
  features:    z.array(featureSchema).optional(),
});

export const updateTemplateSchema = z.object({
  name:        z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  category:    z.string().trim().max(100).optional(),
  features:    z.array(featureSchema).optional(),
});

// ── Apply ─────────────────────────────────────────────────────────────────────

export const applyTemplateSchema = z.object({
  templateId: z.string().uuid(),
});
