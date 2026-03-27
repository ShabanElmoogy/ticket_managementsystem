export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  type: BoardType;
  createdAt: string;
  updatedAt: string;
  columns: KanbanColumn[];
  tickets: KanbanTicket[];
  tasks: KanbanTask[];
  permissions: BoardPermission[];
}

export interface KanbanColumn {
  id: string;
  name: string;
  description?: string;
  color?: string;
  position: number;
  wipLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  boardId: string;
}

export interface KanbanTicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  position: number;
  createdAt: string;
  updatedAt: string;
  assignedTo?: User;
  createdBy: User;
  customer?: Customer;
  application?: Application;
  boardId?: string;
  labels: TicketLabel[];
  _count: {
    comments: number;
  };
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  boardId: string;
  columnId: string;
  board: {
    id: string;
    name: string;
    type: BoardType;
  };
  column: {
    id: string;
    name: string;
    color?: string;
  };
}

export interface TicketLabel {
  id: string;
  ticketId: string;
  labelId: string;
  label: Label;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardPermission {
  id: string;
  userId: string;
  boardId: string;
  role: BoardPermissionRole;
  user: User;
}

export interface TicketActivity {
  id: string;
  action: ActivityType;
  description: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  ticketId: string;
  userId: string;
  user: User;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  userId: string;
  ticketId?: string;
  ticket?: {
    id: string;
    title: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Customer {
  id: string;
  name: string;
}

export interface Application {
  id: string;
  name: string;
  version?: string;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type BoardType = 'TICKETS' | 'TASKS';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type BoardPermissionRole = 'VIEWER' | 'EDITOR' | 'ADMIN';
export type ActivityType = 
  | 'CREATED' 
  | 'UPDATED' 
  | 'STATUS_CHANGED' 
  | 'ASSIGNED' 
  | 'UNASSIGNED' 
  | 'MOVED' 
  | 'COMMENTED' 
  | 'LABEL_ADDED' 
  | 'LABEL_REMOVED' 
  | 'DUE_DATE_CHANGED' 
  | 'PRIORITY_CHANGED';

export type NotificationType = 
  | 'TICKET_ASSIGNED' 
  | 'TICKET_UPDATED' 
  | 'TICKET_COMMENTED' 
  | 'TICKET_DUE_SOON' 
  | 'TICKET_OVERDUE' 
  | 'MENTION' 
  | 'STATUS_CHANGED';

export interface BoardAnalytics {
  ticketsByStatus: Array<{
    status: TicketStatus;
    _count: { id: number };
  }>;
  ticketsByPriority: Array<{
    priority: Priority;
    _count: { id: number };
  }>;
  avgCompletionTime: number;
  totalTickets: number;
  completedTickets: number;
  completionRate: number;
}

// DragResult is imported from @hello-pangea/dnd
// No need to define it here