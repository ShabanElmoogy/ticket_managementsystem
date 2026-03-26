import { api } from "../../../services/api/base";
import type { ProgrammingDetails } from "../../../services/api/types";

export const programmingApi = {
  get: (ticketId: string): Promise<ProgrammingDetails | null> =>
    api.get<ProgrammingDetails | null>(`/tickets/${ticketId}/programming`),

  upsert: (ticketId: string, data: Partial<ProgrammingDetails>): Promise<ProgrammingDetails> =>
    api.put<ProgrammingDetails>(`/tickets/${ticketId}/programming`, data),

  assignProgrammer: (ticketId: string, programmerId: string): Promise<{ id: string; status: string; programmerId: string }> =>
    api.post(`/tickets/${ticketId}/assign-programmer`, { programmerId }),
};
