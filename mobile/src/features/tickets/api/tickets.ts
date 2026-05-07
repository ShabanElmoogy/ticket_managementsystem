import { BaseApiService } from '@/src/services/api/base';
import { API, QUERY_KEYS, buildTicketQuery } from '@/src/constants/api';
import type { TicketFilters } from '@/src/constants/api';
import type {
  Ticket,
  TicketWithComments,
  CreateTicketData,
  BulkUpdateData,
  Comment,
  TicketActivity,
  TicketStatus,
} from '@/src/services/api/types/ticket';
import type { Attachment } from '@/src/services/api/types/attachment';
import type { ProgrammingDetails } from '@/src/services/api/types/programming';
import type { User } from '@/src/services/api/types/user';

export class TicketsApiService extends BaseApiService {
  // ── CRUD ──────────────────────────────────────────────────────────────────

  getTickets = (filters?: TicketFilters) =>
    this.get<Ticket[]>(buildTicketQuery(filters ?? {}));

  getTicket = (id: string) =>
    this.get<TicketWithComments>(API.TICKETS.BY_ID(id));

  createTicket = (data: CreateTicketData) =>
    this.post<Ticket>(API.TICKETS.LIST, data);

  updateTicket = (id: string, data: Partial<CreateTicketData>) =>
    this.put<Ticket>(API.TICKETS.BY_ID(id), data);

  deleteTicket = (id: string) =>
    this.delete<{ message: string }>(API.TICKETS.BY_ID(id));

  // ── Bulk ──────────────────────────────────────────────────────────────────

  bulkUpdate = (ids: string[], status: TicketStatus) =>
    this.patch<{ updated: number }>(API.TICKETS.BULK, { ids, status } as BulkUpdateData);

  // ── Ticket actions ────────────────────────────────────────────────────────

  takeTicket = (id: string) =>
    this.post<Ticket>(API.TICKETS.TAKE(id), {});

  reassignTicket = (id: string, assignedToId: string) =>
    this.put<Ticket>(API.TICKETS.REASSIGN(id), { assignedToId });

  restoreTicket = (id: string) =>
    this.post<Ticket>(API.TICKETS.RESTORE(id), {});

  // ── Comments ──────────────────────────────────────────────────────────────

  getComments = (id: string) =>
    this.get<Comment[]>(API.TICKETS.COMMENTS(id));

  addComment = (id: string, content: string) =>
    this.post<Comment>(API.TICKETS.COMMENTS(id), { content });

  deleteComment = (id: string, commentId: string) =>
    this.delete<{ message: string }>(API.TICKETS.COMMENT_BY_ID(id, commentId));

  // ── Attachments ───────────────────────────────────────────────────────────

  getAttachments = (id: string) =>
    this.get<Attachment[]>(API.TICKETS.ATTACHMENTS(id));

  uploadAttachment = (id: string, file: FormData) =>
    this.post<Attachment>(API.TICKETS.ATTACHMENTS(id), file);

  deleteAttachment = (id: string, attachmentId: string) =>
    this.delete<{ message: string }>(API.TICKETS.ATTACHMENT_BY_ID(id, attachmentId));

  // ── Activities ────────────────────────────────────────────────────────────

  getActivities = (id: string) =>
    this.get<TicketActivity[]>(`${API.TICKETS.BY_ID(id)}/activities`);

  // ── Watchers ──────────────────────────────────────────────────────────────

  watchTicket = (id: string) =>
    this.post<{ watching: boolean }>(API.TICKETS.WATCH(id), {});

  getWatchers = (id: string) =>
    this.get<User[]>(API.TICKETS.WATCHERS(id));

  // ── Programming ───────────────────────────────────────────────────────────

  assignProgrammer = (id: string, programmerId: string) =>
    this.post<Ticket>(API.TICKETS.ASSIGN_PROGRAMMER(id), { programmerId });

  getProgramming = (id: string) =>
    this.get<ProgrammingDetails>(API.TICKETS.PROGRAMMING(id));

  saveProgramming = (id: string, data: Partial<ProgrammingDetails>) =>
    this.put<ProgrammingDetails>(API.TICKETS.PROGRAMMING(id), data);
}

export const ticketsApi  = new TicketsApiService();
export const ticketsKeys = QUERY_KEYS.TICKETS;
