import { API, QUERY_KEYS } from '@/src/constants/api';
import { BaseApiService } from '@/src/services/api/base';
import type { TicketTemplate } from '@/src/services/api/types';

export interface TicketTemplatePayload {
  name: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
}

export class TicketTemplatesApiService extends BaseApiService {
  list   = ()                                                  => this.get<TicketTemplate[]>(API.TEMPLATES.LIST);
  create = (data: TicketTemplatePayload)                       => this.post<TicketTemplate>(API.TEMPLATES.LIST, data);
  update = (id: string, data: Partial<TicketTemplatePayload>) => this.put<TicketTemplate>(API.TEMPLATES.BY_ID(id), data);
  remove = (id: string)                                        => this.delete<{ message: string }>(API.TEMPLATES.BY_ID(id));
}

export const ticketTemplatesApi  = new TicketTemplatesApiService();
export const ticketTemplatesKeys = QUERY_KEYS.TEMPLATES;
