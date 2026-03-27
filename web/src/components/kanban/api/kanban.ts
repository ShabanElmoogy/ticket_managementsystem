import { BaseApiService } from "../../../services/api/base";
import type {
  KanbanBoard,
  KanbanTicket,
  KanbanTask,
  Label,
  Notification,
  BoardAnalytics,
  TicketStatus,
  TaskStatus,
} from "../types/types";

export class KanbanApiService extends BaseApiService {
  async getAllBoards(): Promise<KanbanBoard[]> {
    return this.get<KanbanBoard[]>("/kanban/boards");
  }

  async getBoardById(boardId: string): Promise<KanbanBoard> {
    return this.get<KanbanBoard>(`/kanban/boards/${boardId}`);
  }

  async createBoard(boardData: Partial<KanbanBoard>): Promise<KanbanBoard> {
    return this.post<KanbanBoard>("/kanban/boards", boardData);
  }

  async updateBoard(boardId: string, boardData: Partial<KanbanBoard>): Promise<KanbanBoard> {
    return this.put<KanbanBoard>(`/kanban/boards/${boardId}`, boardData);
  }

  async deleteBoard(boardId: string): Promise<void> {
    await this.delete(`/kanban/boards/${boardId}`);
  }

  async moveTicket(
    ticketId: string,
    moveData: {
      newStatus: TicketStatus;
      newPosition: number;
      boardId?: string;
    }
  ): Promise<KanbanTicket> {
    return this.put<KanbanTicket>(`/kanban/tickets/${ticketId}/move`, moveData);
  }

  async createTask(taskData: Partial<KanbanTask>): Promise<KanbanTask> {
    return this.post<KanbanTask>("/tasks", taskData);
  }

  async moveTask(
    taskId: string,
    moveData: {
      newStatus: TaskStatus;
      newPosition: number;
      columnId?: string;
    }
  ): Promise<KanbanTask> {
    return this.put<KanbanTask>(`/kanban/tasks/${taskId}/move`, moveData);
  }

  async addColumn(
    boardId: string,
    columnData: {
      name: string;
      description?: string;
      color?: string;
      wipLimit?: number;
    }
  ) {
    return this.post(`/kanban/boards/${boardId}/columns`, columnData);
  }

  async updateColumn(
    columnId: string,
    columnData: {
      name?: string;
      description?: string;
      color?: string;
      wipLimit?: number;
    }
  ) {
    return this.put(`/kanban/columns/${columnId}`, columnData);
  }

  async deleteColumn(columnId: string): Promise<void> {
    await this.delete(`/kanban/columns/${columnId}`);
  }

  async getAllLabels(): Promise<Label[]> {
    return this.get<Label[]>("/labels");
  }

  async createLabel(labelData: Partial<Label>): Promise<Label> {
    return this.post<Label>("/labels", labelData);
  }

  async updateLabel(labelId: string, labelData: Partial<Label>): Promise<Label> {
    return this.put<Label>(`/labels/${labelId}`, labelData);
  }

  async deleteLabel(labelId: string): Promise<void> {
    await this.delete(`/labels/${labelId}`);
  }

  async addLabelToTicket(ticketId: string, labelId: string) {
    return this.post("/labels/assign", { ticketId, labelId });
  }

  async removeLabelFromTicket(ticketId: string, labelId: string): Promise<void> {
    await this.delete(`/labels/${labelId}/tickets/${ticketId}`);
  }

  async getNotifications(
    params?: {
      limit?: number;
      unreadOnly?: boolean;
    }
  ): Promise<Notification[]> {
    return this.get<Notification[]>("/notifications", { params });
  }

  async getNotificationCount(): Promise<{ unreadCount: number }> {
    return this.get<{ unreadCount: number }>("/notifications/count");
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    return this.put<Notification>(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.put("/notifications/read-all");
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.delete(`/notifications/${notificationId}`);
  }

  async getBoardAnalytics(
    boardId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<BoardAnalytics> {
    return this.get<BoardAnalytics>(`/kanban/boards/${boardId}/analytics`, { params });
  }
}

export const kanbanApi = new KanbanApiService();
