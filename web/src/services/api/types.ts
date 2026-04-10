// API Types
export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'EMPLOYEE' | 'PROGRAMMER';

export type TicketStatus =
  | 'OPEN' | 'IN_PROGRESS' | 'PROGRAMMING'
  | 'UNDER_DEVELOPMENT' | 'CODE_REVIEW'
  | 'TESTING' | 'RESOLVED' | 'CLOSED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string | null;
  tenantName?: string | null;
  phone?: string;
  whatsappNotifications?: boolean;
  reminderEnabled?: boolean;
  reminderInterval?: number;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    assignedTickets: number;
    createdTickets: number;
    comments: number;
  };
}

export type MaintenanceType = 'MONTHLY_SUBSCRIPTION' | 'FREE_TRIAL' | 'PAY_AS_YOU_GO';
export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'PAY_AS_YOU_GO' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  company?: string;
  maintenanceType?: MaintenanceType | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  subscriptionStatus?: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
  applications?: CustomerApplication[];
  _count?: {
    tickets: number;
  };
}

export interface Application {
  id: string;
  name: string;
  description?: string;
  version?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customers?: CustomerApplication[];
  _count?: {
    tickets: number;
    customers: number;
  };
}

export interface CustomerApplication {
  id: string;
  customerId: string;
  applicationId: string;
  assignedAt: string;
  customer?: Customer;
  application?: Application;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
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
  _count?: {
    comments: number;
  };
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

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgEstimationAccuracy?: number | null;
  avgResolutionHours?: number | null;
}

// Create/Update Types
export interface CreateTicketData {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedToId?: string;
  customerId?: string;
  applicationId?: string;
  boardId?: string;
  dueDate?: string;
  estimatedHours?: number;
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  applicationIds?: string[];
  maintenanceType?: MaintenanceType | null;
  subscriptionStartDate?: string | Date | null;
  subscriptionEndDate?: string | Date | null;
}

export interface CreateApplicationData {
  name: string;
  description?: string;
  version?: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  phone?: string;
  whatsappNotifications?: boolean;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  phone?: string;
  whatsappNotifications?: boolean;
  reminderEnabled?: boolean;
  reminderInterval?: number;
}

export interface ReminderSettings {
  reminderEnabled: boolean;
  reminderInterval: number;
}

export interface UserStats {
  total: number;
  active: number;
  byRole: {
    SUPER_ADMIN?: number;
    TENANT_ADMIN?: number;
    EMPLOYEE?: number;
    PROGRAMMER?: number;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  tenantSuspended?: boolean;
}

export interface SolutionStep {
  order: number;
  text: string;
  done: boolean;
}

export interface CodeSnippet {
  language: string;
  code: string;
  label?: string;
}

export interface ProgrammingDetails {
  id: string;
  ticketId: string;
  tenantId: string;
  programmerId?: string;
  technicalDescription?: string;
  rootCause?: string;
  stepsToReproduce?: string;
  solutionSteps: SolutionStep[];
  codeSnippets: CodeSnippet[];
  attachments: { url: string; filename: string; size: number }[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  ticketId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string };
}

export interface TicketTemplate {
  id: string;
  name: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number | null;
  tenantId?: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
}

export interface Epic {
  id: string;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  tenantId?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  applicationId?: string | null;
  applicationName?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  targetDate?: string | null;
  featureCount: number;
  stepsTotal: number;
  stepsDone: number;
  featureStatusCounts?: Partial<Record<FeatureRequest['status'], number>>;
  features?: Pick<FeatureRequest, 'id' | 'title' | 'description' | 'status' | 'createdAt'> & { epicOrder: number; applicationName?: string | null; customerName?: string | null; submittedByName?: string | null; voteCount?: number; }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpicData {
  title: string;
  description?: string;
  ownerId?: string | null;
  applicationId?: string | null;
  customerId?: string | null;
  targetDate?: string | null;
}

export interface UpdateEpicData {
  title?: string;
  description?: string | null;
  status?: Epic['status'];
  ownerId?: string | null;
  applicationId?: string | null;
  customerId?: string | null;
  targetDate?: string | null;
}

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

export interface Notification {
  id: string;
  type: "TICKET_CREATED" | "TICKET_UPDATED" | "TICKET_ASSIGNED" | "COMMENT_ADDED";
  data: {
    ticket?: { id: string; title: string; priority?: string; status?: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    reassignedTo?: string;
    description?: string;
    commentBy?: string;
    newStatus?: string;
  };
  timestamp: string;
  read?: boolean;
}

export interface ActivityItem {
  id: string;
  type: "TICKET_CREATED" | "TICKET_UPDATED" | "TICKET_ASSIGNED" | "COMMENT_ADDED" | "COMMENT_DELETED" | "COMMENT_MENTION";
  data: {
    ticket?: { id: string; title: string; priority?: string; status?: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    reassignedTo?: string;
    description?: string;
    commentBy?: string;
    mentionedBy?: string;
    mentionedUsers?: string[];
    comment?: string;
    newStatus?: string;
  };
  timestamp: string;
  read?: boolean;
}