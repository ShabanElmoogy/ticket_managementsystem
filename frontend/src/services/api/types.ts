// API Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
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

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  isActive: boolean;
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
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
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
  _count?: {
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  ticketId: string;
  userId: string;
}

export interface TicketWithComments extends Ticket {
  comments: Comment[];
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
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
  role?: "ADMIN" | "EMPLOYEE";
  phone?: string;
  whatsappNotifications?: boolean;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  password?: string;
  role?: "ADMIN" | "EMPLOYEE";
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
    ADMIN?: number;
    EMPLOYEE?: number;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ActivityItem {
  id: string;
  type: "TICKET_CREATED" | "TICKET_UPDATED" | "TICKET_ASSIGNED" | "COMMENT_ADDED";
  data: {
    ticket?: { id: string; title: string; priority?: string; status?: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    commentBy?: string;
  };
  timestamp: string;
  read?: boolean;
}