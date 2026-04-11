import { BaseApiService } from '../../../services/api/base';

export interface TemplateStep {
  title: string;
  description?: string;
}

export interface TemplateFeature {
  title: string;
  description?: string;
  steps?: TemplateStep[];
}

export interface EpicTemplate {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  features: TemplateFeature[];
  tenantId?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category?: string;
  features: TemplateFeature[];
}

class EpicTemplatesApiService extends BaseApiService {
  list(): Promise<EpicTemplate[]> {
    return this.get('/epic-templates');
  }
  getOne(id: string): Promise<EpicTemplate> {
    return this.get(`/epic-templates/${id}`);
  }
  create(data: CreateTemplateData): Promise<EpicTemplate> {
    return this.post('/epic-templates', data);
  }
  update(id: string, data: Partial<CreateTemplateData>): Promise<EpicTemplate> {
    return this.put(`/epic-templates/${id}`, data);
  }
  remove(id: string): Promise<{ message: string }> {
    return this.delete(`/epic-templates/${id}`);
  }
  apply(epicId: string, templateId: string): Promise<{ created: number }> {
    return this.post(`/epic-templates/apply/${epicId}`, { templateId });
  }
}

export const epicTemplatesApi = new EpicTemplatesApiService();
