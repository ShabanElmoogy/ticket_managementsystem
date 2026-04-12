import type { TicketStatus } from './ticket.ts';
import type { FeatureRequest } from './feature.ts';

export interface LinkedTicket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  customerName?: string | null;
  assignedToName?: string | null;
}

export interface Epic {
  id: string;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tags: string[];
  tenantId?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  applicationId?: string | null;
  applicationName?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  targetDate?: string | null;
  estimatedDays?: number | null;
  parentEpicId?: string | null;
  parentEpic?: { id: string; title: string; status: Epic['status'] } | null;
  subEpics?: Pick<Epic, 'id' | 'title' | 'status' | 'priority' | 'featureCount' | 'stepsTotal' | 'stepsDone'>[];
  ancestors?: { id: string; title: string; status: Epic['status'] }[];
  featureCount: number;
  stepsTotal: number;
  stepsDone: number;
  featureStatusCounts?: Partial<Record<FeatureRequest['status'], number>>;
  blockedBy?: { id: string; title: string; status: Epic['status'] }[];
  blocking?: { id: string; title: string; status: Epic['status'] }[];
  features?: (Pick<FeatureRequest, 'id' | 'title' | 'description' | 'status' | 'createdAt'> & {
    epicOrder: number;
    applicationName?: string | null;
    customerName?: string | null;
    submittedByName?: string | null;
    voteCount?: number;
  })[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpicData {
  title: string;
  description?: string;
  priority?: Epic['priority'];
  tags?: string[];
  ownerId?: string | null;
  applicationId?: string | null;
  customerId?: string | null;
  targetDate?: string | null;
  estimatedDays?: number | null;
  parentEpicId?: string | null;
}

export interface UpdateEpicData {
  title?: string;
  description?: string | null;
  status?: Epic['status'];
  priority?: Epic['priority'];
  tags?: string[];
  ownerId?: string | null;
  applicationId?: string | null;
  customerId?: string | null;
  targetDate?: string | null;
  estimatedDays?: number | null;
  parentEpicId?: string | null;
}

export type EpicRelationType = 'RELATES_TO' | 'DUPLICATES' | 'DEPENDS_ON' | 'SPLIT_FROM';

export interface EpicRelation {
  id: string;
  relationType: EpicRelationType;
  direction: 'outgoing' | 'incoming';
  epicId: string;
  title: string;
  status: Epic['status'];
  priority: Epic['priority'];
}

export interface EpicNetworkNode {
  id: string;
  title: string;
  status: Epic['status'];
  priority: Epic['priority'];
}

export interface EpicNetworkEdge {
  id?: string;
  source: string;
  target: string;
  type: EpicRelationType | 'BLOCKS' | 'PARENT_OF';
}

export interface EpicNetworkGraph {
  nodes: EpicNetworkNode[];
  edges: EpicNetworkEdge[];
}
