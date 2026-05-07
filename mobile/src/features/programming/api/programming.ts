import { BaseApiService } from '@/src/services/api/base';
import { API, QUERY_KEYS } from '@/src/constants/api';
import type { ProgrammingDetails } from '@/src/services/api/types/programming';
import type { Ticket } from '@/src/services/api/types/ticket';
import type { User } from '@/src/services/api/types/user';

/**
 * ProgrammingApiService — wraps the ticket programming sub-resource endpoints.
 *
 * All programming data lives under /tickets/:id/programming and
 * /tickets/:id/assign-programmer. This service provides a focused interface
 * for the Programming screen and ProgrammingPanel component.
 */
export class ProgrammingApiService extends BaseApiService {
  // ── Programming details ───────────────────────────────────────────────────

  /** Fetch the programming details for a ticket */
  getProgramming = (ticketId: string) =>
    this.get<ProgrammingDetails>(API.TICKETS.PROGRAMMING(ticketId));

  /** Save (full or partial) programming details for a ticket */
  saveProgramming = (ticketId: string, data: Partial<ProgrammingDetails>) =>
    this.put<ProgrammingDetails>(API.TICKETS.PROGRAMMING(ticketId), data);

  // ── Programmer assignment ─────────────────────────────────────────────────

  /** Assign a programmer to a ticket */
  assignProgrammer = (ticketId: string, programmerId: string) =>
    this.post<Ticket>(API.TICKETS.ASSIGN_PROGRAMMER(ticketId), { programmerId });

  /** Fetch the list of users with PROGRAMMER role (for the assignment picker) */
  getProgrammers = () =>
    this.get<User[]>(API.USERS.PROGRAMMERS);
}

export const programmingApi  = new ProgrammingApiService();
export const programmingKeys = QUERY_KEYS.PROGRAMMING;
