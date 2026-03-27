import { api } from '../../../../services/api/base';
import type { TicketTemplate } from '../../../../services/api/types';

export interface TemplatePayload {
  name: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number | null;
}

export const templatesApi = {
  list:   ()                              => api.get<TicketTemplate[]>('/templates'),
  create: (data: TemplatePayload)         => api.post<TicketTemplate>('/templates', data),
  update: (id: string, data: Partial<TemplatePayload>) => api.put<TicketTemplate>(`/templates/${id}`, data),
  delete: (id: string)                    => api.delete<{ message: string }>(`/templates/${id}`),
};
