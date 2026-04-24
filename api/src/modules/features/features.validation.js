import { z } from 'zod';

const uuid    = z.string().uuid();
const uuidOpt = uuid.nullable().optional();

const FEATURE_STATUSES = ['UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED'];
const STEP_STATUSES    = ['TODO', 'IN_PROGRESS', 'DONE'];

// ── Feature CRUD ──────────────────────────────────────────────────────────────

export const createFeatureSchema = z.object({
  title:         z.string().trim().min(1, 'title is required').max(255),
  description:   z.string().trim().min(1, 'description is required').max(5000),
  applicationId: uuidOpt,
  customerId:    uuidOpt,
});

export const updateFeatureSchema = z.object({
  title:          z.string().trim().min(1).max(255).optional(),
  description:    z.string().trim().min(1).max(5000).optional(),
  status:         z.enum(FEATURE_STATUSES).optional(),
  linkedTicketId: uuidOpt,
  applicationId:  uuidOpt,
  customerId:     uuidOpt,
});

// ── Feature steps ─────────────────────────────────────────────────────────────

export const createStepSchema = z.object({
  title:                z.string().trim().min(1, 'title is required').max(255),
  description:          z.string().trim().max(2000).nullable().optional(),
  assignedToId:         uuidOpt,
  assignedProgrammerId: uuidOpt,
  linkedTicketId:       uuidOpt,
});

export const updateStepSchema = z.object({
  title:                z.string().trim().min(1).max(255).optional(),
  description:          z.string().trim().max(2000).nullable().optional(),
  status:               z.enum(STEP_STATUSES).optional(),
  order:                z.number().int().min(0).optional(),
  assignedToId:         uuidOpt,
  assignedProgrammerId: uuidOpt,
  linkedTicketId:       uuidOpt,
});
