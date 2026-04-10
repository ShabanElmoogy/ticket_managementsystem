import type { FeatureRequest } from '../../../services/api/types';

export type EpicFeature = {
  id: string;
  title: string;
  description?: string | null;
  status: FeatureRequest['status'];
  epicOrder: number;
  createdAt: string;
  applicationId?: string | null;
  customerId?: string | null;
  applicationName?: string | null;
  customerName?: string | null;
  submittedByName?: string | null;
  voteCount?: number;
};
