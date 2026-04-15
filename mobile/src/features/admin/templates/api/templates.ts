import { BaseApiService } from '../../../../services/api/base';
import type { TicketTemplate } from '../../../../services/api/types';

export interface TicketTemplatePayload {
  name: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
}

export class TicketTemplatesApiService extends BaseApiService {
  list   = ()                                                  => this.get<TicketTemplate[]>('/templates');
  create = (data: TicketTemplatePayload)                       => this.post<TicketTemplate>('/templates', data);
  update = (id: string, data: Partial<TicketTemplatePayload>) => this.put<TicketTemplate>(`/templates/${id}`, data);
  remove = (id: string)                                        => this.delete<{ message: string }>(`/templates/${id}`);
}

export const ticketTemplatesApi = new TicketTemplatesApiService();

export const ticketTemplatesKeys = {
  all: ['ticket-templates'] as const,
};
