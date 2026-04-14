import { BaseApiService } from '../../../../services/api/base';
import type { TicketTemplate } from '../../../../services/api/types';
import type { TicketTemplatePayload } from '../types/types';

export class TicketTemplatesApiService extends BaseApiService {
  list   = ()                                          => this.get<TicketTemplate[]>('/templates');
  create = (data: TicketTemplatePayload)               => this.post<TicketTemplate>('/templates', data);
  update = (id: string, data: Partial<TicketTemplatePayload>) => this.put<TicketTemplate>(`/templates/${id}`, data);
  remove = (id: string)                               => this.delete<{ message: string }>(`/templates/${id}`);
}

export const ticketTemplatesApi = new TicketTemplatesApiService();
