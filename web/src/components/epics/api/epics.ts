import { BaseApiService } from '../../../services/api/base';
import type { Epic, CreateEpicData, UpdateEpicData } from '../../../services/api/types';

class EpicsApiService extends BaseApiService {
  list(): Promise<Epic[]> {
    return this.get('/epics');
  }
  getOne(id: string): Promise<Epic> {
    return this.get(`/epics/${id}`);
  }
  create(data: CreateEpicData): Promise<Epic> {
    return this.post('/epics', data);
  }
  update(id: string, data: UpdateEpicData): Promise<Epic> {
    return this.put(`/epics/${id}`, data);
  }
  remove(id: string): Promise<{ message: string }> {
    return this.delete(`/epics/${id}`);
  }
  linkFeature(epicId: string, featureId: string): Promise<{ message: string }> {
    return this.post(`/epics/${epicId}/features`, { featureId });
  }
  unlinkFeature(epicId: string, featureId: string): Promise<{ message: string }> {
    return this.delete(`/epics/${epicId}/features/${featureId}`);
  }
}

export const epicsApi = new EpicsApiService();
