import { API, QUERY_KEYS, buildTicketQuery } from '@/src/constants/api';
import { BaseApiService } from '@/src/services/api/base';
import type { Ticket, TicketWithComments, CreateTicketData, Comment } from '@/src/services/api/types';

export type { TicketFilters } from '@/src/constants/api';

export class TicketsApiService extends BaseApiService {
  getTickets = (filters?: Parameters<typeof buildTicketQuery>[0]) => {
    const params: Record<string, string> = {};
    if (filters?.status)        params.status        = filters.status;
    if (filters?.priority)      params.priority      = filters.priority;
    if (filters?.assignedTo)    params.assignedTo    = filters.assignedTo;
    if (filters?.search?.trim())params.search        = filters.search!.trim();
    if (filters?.customerId)    params.customerId    = filters.customerId;
    if (filters?.applicationId) params.applicationId = filters.applicationId;
    if (filters?.userId)        params.userId        = filters.userId;
    params.deleted = filters?.deleted === true ? 'true' : 'false';
    params.limit   = '50';
    return this.get<Ticket[]>(API.TICKETS.LIST, { params, timeout: 30_000 });
  };

  getTicket        = (id: string)                              => this.get<TicketWithComments>(API.TICKETS.BY_ID(id));
  createTicket     = (data: CreateTicketData)                  => this.post<Ticket>(API.TICKETS.LIST, data);
  updateTicket     = (id: string, data: Partial<Ticket>)       => this.put<Ticket>(API.TICKETS.BY_ID(id), data);
  deleteTicket     = (id: string)                              => this.delete<{ message: string }>(API.TICKETS.BY_ID(id));
  restoreTicket    = (id: string)                              => this.patch<{ message: string }>(API.TICKETS.RESTORE(id), {});
  takeTicket       = (id: string)                              => this.post<Ticket>(API.TICKETS.TAKE(id), {});
  reassignTicket   = (id: string, assignedToId: string)        => this.patch<Ticket>(API.TICKETS.REASSIGN(id), { assignedToId });
  bulkUpdateStatus = (ids: string[], status: string)           => this.patch<{ updated: number }>(API.TICKETS.BULK, { ids, status });
  addComment       = (ticketId: string, content: string)       => this.post<Comment>(API.TICKETS.COMMENTS(ticketId), { content });
  deleteComment    = (ticketId: string, commentId: string)     => this.delete<{ message: string }>(API.TICKETS.COMMENT_BY_ID(ticketId, commentId));
  watchTicket      = (id: string)                              => this.post(API.TICKETS.WATCH(id), {});
  unwatchTicket    = (id: string)                              => this.delete(API.TICKETS.WATCH(id));
  getWatchers      = (id: string)                              => this.get(API.TICKETS.WATCHERS(id));
  getAttachments   = (id: string)                              => this.get(API.TICKETS.ATTACHMENTS(id));
  deleteAttachment = (id: string, attachmentId: string)        => this.delete(API.TICKETS.ATTACHMENT_BY_ID(id, attachmentId));
  getProgramming   = (id: string)                              => this.get(API.TICKETS.PROGRAMMING(id));
  saveProgramming  = (id: string, data: unknown)               => this.put(API.TICKETS.PROGRAMMING(id), data);
  assignProgrammer = (id: string, programmerId: string)        => this.post(API.TICKETS.ASSIGN_PROGRAMMER(id), { programmerId });
}

export const ticketsApi  = new TicketsApiService();
export const ticketsKeys = QUERY_KEYS.TICKETS;
