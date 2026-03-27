import { api } from '../../../services/api/base';

export interface Watcher {
  id: string;
  name: string;
  email: string;
}

export const watchersApi = {
  list:    (ticketId: string) => api.get<Watcher[]>(`/tickets/${ticketId}/watchers`),
  watch:   (ticketId: string) => api.post<{ watching: boolean }>(`/tickets/${ticketId}/watch`),
  unwatch: (ticketId: string) => api.delete<{ watching: boolean }>(`/tickets/${ticketId}/watch`),
};
