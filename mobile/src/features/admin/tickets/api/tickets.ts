import { BaseApiService } from '../../../../services/api/base';
import type { Ticket, TicketWithComments, CreateTicketData, Comment } from '../../../../services/api/types';

export interface TicketFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  deleted?: boolean;
  search?: string;
  customerId?: string;
  applicationId?: string;
  userId?: string;
}

export class TicketsApiService extends BaseApiService {
  getTickets = (filters?: TicketFilters) => {
    const params: Record<string, string> = {};
    if (filters?.status)      params.status      = filters.status;
    if (filters?.priority)    params.priority    = filters.priority;
    if (filters?.assignedTo)  params.assignedTo  = filters.assignedTo;
    if (filters?.search?.trim()) params.search   = filters.search.trim();
    if (filters?.customerId)  params.customerId  = filters.customerId;
    if (filters?.applicationId) params.applicationId = filters.applicationId;
    if (filters?.userId)      params.userId      = filters.userId;
    params.deleted = filters?.deleted === true ? 'true' : 'false';
    return this.get<Ticket[]>('/tickets', { params });
  };

  getTicket       = (id: string)                              => this.get<TicketWithComments>(`/tickets/${id}`);
  createTicket    = (data: CreateTicketData)                  => this.post<Ticket>('/tickets', data);
  updateTicket    = (id: string, data: Partial<Ticket>)       => this.put<Ticket>(`/tickets/${id}`, data);
  deleteTicket    = (id: string)                              => this.delete<{ message: string }>(`/tickets/${id}`);
  restoreTicket   = (id: string)                              => this.patch<{ message: string }>(`/tickets/${id}/restore`, {});
  takeTicket      = (id: string)                              => this.post<Ticket>(`/tickets/${id}/take`, {});
  addComment      = (ticketId: string, content: string)       => this.post<Comment>(`/tickets/${ticketId}/comments`, { content });
  deleteComment   = (ticketId: string, commentId: string)     => this.delete<{ message: string }>(`/tickets/${ticketId}/comments/${commentId}`);
  reassignTicket  = (id: string, assignedToId: string)        => this.patch<Ticket>(`/tickets/${id}/reassign`, { assignedToId });
  bulkUpdateStatus = (ids: string[], status: string)          => this.patch<{ updated: number }>('/tickets/bulk', { ids, status });
}

export const ticketsApi = new TicketsApiService();

export const ticketsKeys = {
  all:    ['admin-tickets']                       as const,
  detail: (id: string) => ['admin-tickets', id]   as const,
};
