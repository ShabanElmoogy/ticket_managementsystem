import axios from 'axios';
import type { 
  KanbanBoard, 
  KanbanTicket, 
  KanbanTask,
  Label, 
  Notification, 
  BoardAnalytics,
  TicketStatus,
  TaskStatus 
} from '../types/kanban';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Board API
export const kanbanApi = {
  // Board operations
  getAllBoards: async (): Promise<KanbanBoard[]> => {
    const response = await api.get('/kanban/boards');
    return response.data;
  },

  getBoardById: async (boardId: string): Promise<KanbanBoard> => {
    const response = await api.get(`/kanban/boards/${boardId}`);
    return response.data;
  },

  createBoard: async (boardData: Partial<KanbanBoard>): Promise<KanbanBoard> => {
    const response = await api.post('/kanban/boards', boardData);
    return response.data;
  },

  updateBoard: async (boardId: string, boardData: Partial<KanbanBoard>): Promise<KanbanBoard> => {
    const response = await api.put(`/kanban/boards/${boardId}`, boardData);
    return response.data;
  },

  deleteBoard: async (boardId: string): Promise<void> => {
    await api.delete(`/kanban/boards/${boardId}`);
  },

  // Ticket movement
  moveTicket: async (
    ticketId: string, 
    moveData: {
      newStatus: TicketStatus;
      newPosition: number;
      boardId?: string;
    }
  ): Promise<KanbanTicket> => {
    const response = await api.put(`/kanban/tickets/${ticketId}/move`, moveData);
    return response.data;
  },

  // Task operations
  createTask: async (taskData: Partial<KanbanTask>): Promise<KanbanTask> => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  moveTask: async (
    taskId: string, 
    moveData: {
      newStatus: TaskStatus;
      newPosition: number;
      columnId?: string;
    }
  ): Promise<KanbanTask> => {
    const response = await api.put(`/kanban/tasks/${taskId}/move`, moveData);
    return response.data;
  },

  // Column operations
  addColumn: async (
    boardId: string, 
    columnData: {
      name: string;
      description?: string;
      color?: string;
      wipLimit?: number;
    }
  ) => {
    const response = await api.post(`/kanban/boards/${boardId}/columns`, columnData);
    return response.data;
  },

  updateColumn: async (
    columnId: string, 
    columnData: {
      name?: string;
      description?: string;
      color?: string;
      wipLimit?: number;
    }
  ) => {
    const response = await api.put(`/kanban/columns/${columnId}`, columnData);
    return response.data;
  },

  deleteColumn: async (columnId: string): Promise<void> => {
    await api.delete(`/kanban/columns/${columnId}`);
  },

  // Label operations
  getAllLabels: async (): Promise<Label[]> => {
    const response = await api.get('/labels');
    return response.data;
  },

  createLabel: async (labelData: Partial<Label>): Promise<Label> => {
    const response = await api.post('/labels', labelData);
    return response.data;
  },

  updateLabel: async (labelId: string, labelData: Partial<Label>): Promise<Label> => {
    const response = await api.put(`/labels/${labelId}`, labelData);
    return response.data;
  },

  deleteLabel: async (labelId: string): Promise<void> => {
    await api.delete(`/labels/${labelId}`);
  },

  addLabelToTicket: async (ticketId: string, labelId: string) => {
    const response = await api.post('/labels/assign', { ticketId, labelId });
    return response.data;
  },

  removeLabelFromTicket: async (ticketId: string, labelId: string): Promise<void> => {
    await api.delete(`/labels/${labelId}/tickets/${ticketId}`);
  },

  // Notification operations
  getNotifications: async (params?: { 
    limit?: number; 
    unreadOnly?: boolean; 
  }): Promise<Notification[]> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getNotificationCount: async (): Promise<{ unreadCount: number }> => {
    const response = await api.get('/notifications/count');
    return response.data;
  },

  markNotificationAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllNotificationsAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  // Analytics
  getBoardAnalytics: async (
    boardId: string, 
    params?: { 
      startDate?: string; 
      endDate?: string; 
    }
  ): Promise<BoardAnalytics> => {
    const response = await api.get(`/kanban/boards/${boardId}/analytics`, { params });
    return response.data;
  }
};

export default kanbanApi;