import axios, {
  type AxiosInstance,
  type AxiosResponse,
  AxiosError,
} from "axios";
import { getErrorMessage } from "../utils/httpUtils";

const API_BASE_URL =
  import.meta.env.PROD ? "/api" : "http://localhost:3001/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  phone?: string;
  whatsappNotifications?: boolean;
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

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 seconds timeout
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Token will be added per request in the methods below
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        throw new Error(getErrorMessage(error));
      }
    );
  }

  private getAuthConfig(token?: string) {
    return token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};
  }

  // Auth endpoints
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>(
      "/auth/login",
      data
    );
    return response.data;
  }

  async register(
    data: LoginData & { name: string; role?: "ADMIN" | "EMPLOYEE" }
  ): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>(
      "/auth/register",
      data
    );
    return response.data;
  }

  // Dashboard endpoints
  async getDashboardStats(token: string): Promise<DashboardStats> {
    const response = await this.axiosInstance.get<DashboardStats>(
      "/dashboard/stats",
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async getActivities(token: string, limit?: number): Promise<any[]> {
    const params = limit ? { limit: limit.toString() } : {};
    const response = await this.axiosInstance.get<any[]>(
      "/dashboard/activities",
      {
        ...this.getAuthConfig(token),
        params,
      }
    );
    return response.data;
  }

  // Ticket endpoints
  async getTickets(
    token: string,
    filters?: { status?: string; priority?: string; assignedTo?: string }
  ): Promise<Ticket[]> {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.assignedTo) params.assignedTo = filters.assignedTo;

    const response = await this.axiosInstance.get<Ticket[]>("/tickets", {
      ...this.getAuthConfig(token),
      params,
    });
    return response.data;
  }

  async getTicket(token: string, id: string): Promise<TicketWithComments> {
    const response = await this.axiosInstance.get<TicketWithComments>(
      `/tickets/${id}`,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async createTicket(token: string, data: CreateTicketData): Promise<Ticket> {
    const response = await this.axiosInstance.post<Ticket>(
      "/tickets",
      data,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async updateTicket(
    token: string,
    id: string,
    data: Partial<Ticket>
  ): Promise<Ticket> {
    const response = await this.axiosInstance.put<Ticket>(
      `/tickets/${id}`,
      data,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async deleteTicket(token: string, id: string): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      `/tickets/${id}`,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async takeTicket(token: string, id: string): Promise<Ticket> {
    const response = await this.axiosInstance.post<Ticket>(
      `/tickets/${id}/take`,
      {},
      this.getAuthConfig(token)
    );
    return response.data;
  }

  // Comment endpoints
  async addComment(
    token: string,
    ticketId: string,
    content: string
  ): Promise<Comment> {
    const response = await this.axiosInstance.post<Comment>(
      `/tickets/${ticketId}/comments`,
      { content },
      this.getAuthConfig(token)
    );
    return response.data;
  }

  // User endpoints
  async getUsers(token: string): Promise<User[]> {
    const response = await this.axiosInstance.get<User[]>(
      "/users",
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async getUser(token: string, id: string): Promise<User> {
    const response = await this.axiosInstance.get<User>(
      `/users/${id}`,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async createUser(token: string, data: CreateUserData): Promise<User> {
    const response = await this.axiosInstance.post<User>(
      "/users",
      data,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async updateUser(
    token: string,
    id: string,
    data: UpdateUserData
  ): Promise<User> {
    const response = await this.axiosInstance.put<User>(
      `/users/${id}`,
      data,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async deleteUser(token: string, id: string, opts?: { force?: boolean }): Promise<{ message: string }> {
    const params = opts?.force ? { force: 'true' } : undefined;
    const response = await this.axiosInstance.delete<{ message: string }>(
      `/users/${id}`,
      { ...this.getAuthConfig(token), params }
    );
    return response.data;
  }

  async getUserStats(token: string): Promise<UserStats> {
    const response = await this.axiosInstance.get<UserStats>(
      "/users/stats",
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async getEmployees(token: string): Promise<User[]> {
    const response = await this.axiosInstance.get<User[]>(
      "/users/employees",
      this.getAuthConfig(token)
    );
    return response.data;
  }

  // Customer endpoints
  async getCustomers(token: string): Promise<Customer[]> {
    const response = await this.axiosInstance.get<Customer[]>(
      "/customers",
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async getCustomer(token: string, id: string): Promise<Customer> {
    const response = await this.axiosInstance.get<Customer>(
      `/customers/${id}`,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async createCustomer(
    token: string,
    data: CreateCustomerData
  ): Promise<Customer> {
    const response = await this.axiosInstance.post<Customer>(
      "/customers",
      data,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async updateCustomer(
    token: string,
    id: string,
    data: Partial<CreateCustomerData>
  ): Promise<Customer> {
    const response = await this.axiosInstance.put<Customer>(
      `/customers/${id}`,
      data,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async deleteCustomer(
    token: string,
    id: string
  ): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      `/customers/${id}`,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  // Application endpoints
  async getApplications(token: string): Promise<Application[]> {
    const response = await this.axiosInstance.get<Application[]>(
      "/applications",
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async getApplication(token: string, id: string): Promise<Application> {
    const response = await this.axiosInstance.get<Application>(
      `/applications/${id}`,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async createApplication(
    token: string,
    data: CreateApplicationData
  ): Promise<Application> {
    const response = await this.axiosInstance.post<Application>(
      "/applications",
      data,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async updateApplication(
    token: string,
    id: string,
    data: Partial<CreateApplicationData>
  ): Promise<Application> {
    const response = await this.axiosInstance.put<Application>(
      `/applications/${id}`,
      data,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async deleteApplication(
    token: string,
    id: string
  ): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      `/applications/${id}`,
      this.getAuthConfig(token)
    );
    return response.data;
  }

  // Customer-Application assignment endpoints
  async assignApplicationToCustomer(
    token: string,
    customerId: string,
    applicationId: string
  ): Promise<CustomerApplication> {
    const response = await this.axiosInstance.post<CustomerApplication>(
      "/customers/assign-application",
      { customerId, applicationId },
      this.getAuthConfig(token)
    );
    return response.data;
  }

  async removeApplicationFromCustomer(
    token: string,
    customerId: string,
    applicationId: string
  ): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      `/customers/${customerId}/applications/${applicationId}`,
      this.getAuthConfig(token)
    );
    return response.data;
  }
}

export const apiService = new ApiService();
