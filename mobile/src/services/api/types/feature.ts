export interface FeatureStep {
  id: string;
  featureRequestId: string;
  title: string;
  description?: string | null;
  order: number;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignedToId?: string | null;
  assignedProgrammerId?: string | null;
  linkedTicketId?: string | null;
  assignedTo?: { id: string; name: string; role: string } | null;
  assignedProgrammer?: { id: string; name: string; role: string } | null;
  linkedTicket?: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStepData {
  title: string;
  description?: string;
  assignedToId?: string | null;
  assignedProgrammerId?: string | null;
  linkedTicketId?: string | null;
}

export interface UpdateStepData {
  title?: string;
  description?: string | null;
  status?: FeatureStep['status'];
  order?: number;
  assignedToId?: string | null;
  assignedProgrammerId?: string | null;
  linkedTicketId?: string | null;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: 'UNDER_REVIEW' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED' | 'DECLINED';
  tenantId?: string | null;
  linkedTicketId?: string | null;
  applicationId?: string | null;
  customerId?: string | null;
  epicId?: string | null;
  applicationName?: string | null;
  customerName?: string | null;
  epicTitle?: string | null;
  submittedBy: { id: string; name: string; email: string };
  voteCount: number;
  votedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureData {
  title: string;
  description: string;
  applicationId?: string | null;
  customerId?: string | null;
}

export interface UpdateFeatureData {
  title?: string;
  description?: string;
  status?: FeatureRequest['status'];
  linkedTicketId?: string | null;
  applicationId?: string | null;
  customerId?: string | null;
}
