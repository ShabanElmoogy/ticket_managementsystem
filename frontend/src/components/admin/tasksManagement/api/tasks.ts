import { BaseApiService } from "../../../../services/api/base";
import type { KanbanTask, KanbanBoard, User } from "../../../../types/kanban";

export class TasksApiService extends BaseApiService {
  async getTasks(): Promise<KanbanTask[]> {
    return this.get<KanbanTask[]>("/tasks");
  }

  async getTask(id: string): Promise<KanbanTask> {
    return this.get<KanbanTask>(`/tasks/${id}`);
  }

  async createTask(data: Partial<KanbanTask>): Promise<KanbanTask> {
    return this.post<KanbanTask>("/tasks", data);
  }

  async updateTask(id: string, data: Partial<KanbanTask>): Promise<KanbanTask> {
    return this.put<KanbanTask>(`/tasks/${id}`, data);
  }

  async deleteTask(id: string): Promise<void> {
    return this.delete<void>(`/tasks/${id}`);
  }

  async getBoards(): Promise<KanbanBoard[]> {
    return this.get<KanbanBoard[]>("/kanban/boards");
  }

  async getUsers(): Promise<User[]> {
    return this.get<User[]>("/users");
  }
}

export const tasksApi = new TasksApiService();
