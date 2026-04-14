import type { User } from './user';
import type { Customer } from './customer';
import type { Application } from './application';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PROGRAMMING'
  | 'UNDER_DEVELOPMENT'
  | 'CODE_REVIEW'
  | 'TESTING'
  | 'RESOLVED'
  | 'CLOSED';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  assignedTo?: User;
  createdBy: User;
  customer?: Customer;
  application?: Application;
  assignedToId?: string;
  createdById: string;
  customerId?: string;
  applicationId?: string;
  programmerId?: string;
  programmer?: User;
  _count?: { comments: number };
  deletedAt?: string | null;
  slaDeadline?: string | null;
  emailMessageId?: string | null;
  emailFrom?: string | null;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  ticketId: string;
  userId: string;
}

export interface TicketActivity {
  id: string;
  action: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  userId: string;
  ticketId: string;
  user: { id: string; name: string; email: string };
}

export interface TicketWithComments extends Ticket {
  comments: Comment[];
  activities: TicketActivity[];
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId?: string;
  customerId?: string;
  applicationId?: string;
  boardId?: string;
  dueDate?: string;
  estimatedHours?: number;
}
