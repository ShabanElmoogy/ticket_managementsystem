import { BaseApiService } from "../../../../services/api/base";
import type { Ticket, TicketWithComments, CreateTicketData, Comment } from "../../../../services/api/types";

export class TicketsApiService extends BaseApiService {
  async getTickets(
    filters?: { status?: string; priority?: string; assignedTo?: string; deleted?: boolean }
  ): Promise<Ticket[]> {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.assignedTo) params.assignedTo = filters.assignedTo;
    params.deleted = filters?.deleted === true ? 'true' : 'false';

    return this.get<Ticket[]>("/tickets", { params });
  }

  async getTicket(id: string): Promise<TicketWithComments> {
    return this.get<TicketWithComments>(`/tickets/${id}`);
  }

  async createTicket(data: CreateTicketData): Promise<Ticket> {
    return this.post<Ticket>("/tickets", data);
  }

  async updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket> {
    return this.put<Ticket>(`/tickets/${id}`, data);
  }

  async deleteTicket(id: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/tickets/${id}`);
  }

  async restoreTicket(id: string): Promise<{ message: string }> {
    return this.patch<{ message: string }>(`/tickets/${id}/restore`, {});
  }

  async takeTicket(id: string): Promise<Ticket> {
    return this.post<Ticket>(`/tickets/${id}/take`, {});
  }

  async addComment(ticketId: string, content: string): Promise<Comment> {
    return this.post<Comment>(`/tickets/${ticketId}/comments`, { content });
  }

  async deleteComment(ticketId: string, commentId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/tickets/${ticketId}/comments/${commentId}`);
  }

  async reassignTicket(id: string, assignedToId: string): Promise<Ticket> {
    return this.patch<Ticket>(`/tickets/${id}/reassign`, { assignedToId });
  }

  async getDelayedTickets(): Promise<Ticket[]> {
    return this.get<Ticket[]>("/reminders/delayed-tickets");
  }

  async getProgrammers(): Promise<{ id: string; name: string; email: string; role: string }[]> {
    return this.get("/users/programmers");
  }
}

export const ticketsApi = new TicketsApiService();