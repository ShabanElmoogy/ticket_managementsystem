import { z } from 'zod';

const uuid    = z.string().uuid();
const uuidOpt = uuid.nullable().optional();
const dateStr = z.string().nullable().optional();

const EPIC_STATUSES   = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const EPIC_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const RELATION_TYPES  = ['RELATES_TO', 'DUPLICATES', 'DEPENDS_ON', 'SPLIT_FROM'];

// ── Epic CRUD ─────────────────────────────────────────────────────────────────

export const createEpicSchema = z.object({
  title:         z.string().trim().min(1, 'title is required').max(255),
  description:   z.string().trim().max(5000).nullable().optional(),
  priority:      z.enum(EPIC_PRIORITIES).optional(),
  status:        z.enum(EPIC_STATUSES).optional(),
  tags:          z.array(z.string().trim().max(50)).optional(),
  ownerId:       uuidOpt,
  applicationId: uuidOpt,
  customerId:    uuidOpt,
  parentEpicId:  uuidOpt,
  targetDate:    dateStr,
  estimatedDays: z.coerce.number().int().min(1).nullable().optional(),
});

export const updateEpicSchema = z.object({
  title:         z.string().trim().min(1).max(255).optional(),
  description:   z.string().trim().max(5000).nullable().optional(),
  status:        z.enum(EPIC_STATUSES).optional(),
  priority:      z.enum(EPIC_PRIORITIES).optional(),
  tags:          z.array(z.string().trim().max(50)).optional(),
  ownerId:       uuidOpt,
  applicationId: uuidOpt,
  customerId:    uuidOpt,
  parentEpicId:  uuidOpt,
  targetDate:    dateStr,
  estimatedDays: z.coerce.number().int().min(1).nullable().optional(),
});

export const bulkUpdateStatusSchema = z.object({
  ids:    z.array(uuid).min(1, 'ids must be a non-empty array'),
  status: z.enum(EPIC_STATUSES),
});

// ── Feature linking ───────────────────────────────────────────────────────────

export const linkFeatureSchema = z.object({
  featureId: uuid,
});

export const reorderFeaturesSchema = z.object({
  order: z.array(z.object({
    id:    uuid,
    order: z.number().int().min(0),
  })).min(1, 'order must be a non-empty array'),
});

// ── Dependencies ──────────────────────────────────────────────────────────────

export const addBlockerSchema = z.object({
  blockerId: uuid,
});

// ── Linked tickets ────────────────────────────────────────────────────────────

export const linkTicketSchema = z.object({
  ticketId: uuid,
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const addRelationSchema = z.object({
  targetEpicId: uuid,
  relationType: z.enum(RELATION_TYPES).optional(),
});
