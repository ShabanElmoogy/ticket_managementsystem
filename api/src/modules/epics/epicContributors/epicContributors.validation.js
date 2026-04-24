import { z } from 'zod';
import { CONTRIBUTOR_ROLES } from './epicContributors.schema.js';

const contributorRole = z.enum(CONTRIBUTOR_ROLES);

export const addContributorSchema = z.object({
  userId: z.string().uuid(),
  role:   contributorRole.optional(),
});

export const updateContributorSchema = z.object({
  role: contributorRole,
});
