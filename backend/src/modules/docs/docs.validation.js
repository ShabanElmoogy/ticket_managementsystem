import { z } from 'zod';

export const createDocSchema = z.object({
  title: z.string().min(1),
  blocks: z.array(z.any()).optional(),
});

export const updateDocSchema = z.object({
  title: z.string().min(1).optional(),
  blocks: z.array(z.any()).optional(),
});

export const createFolderSchema = z.object({
  title: z.string().min(1),
  parentId: z.string().nullable().optional(),
});

export const createDocNodeSchema = z.object({
  title: z.string().min(1).optional(),
  parentId: z.string().nullable().optional(),
  docId: z.string().nullable().optional(),
});

export const renameNodeSchema = z.object({
  title: z.string().min(1),
});

export const moveNodeSchema = z.object({
  newParentId: z.string().nullable().optional(),
  newPosition: z.number().int().min(0),
});
