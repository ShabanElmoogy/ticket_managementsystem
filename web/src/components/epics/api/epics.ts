import { BaseApiService } from '../../../services/api/base';
import type { Epic, CreateEpicData, UpdateEpicData } from '../../../services/api/types';

export interface EpicComment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

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
  reorderFeatures(epicId: string, order: { id: string; order: number }[]): Promise<{ message: string }> {
    return this.put(`/epics/${epicId}/features/reorder`, { order });
  }
  bulkUpdateStatus(ids: string[], status: Epic['status']): Promise<{ updated: number }> {
    return this.put('/epics/bulk-status', { ids, status });
  }
  listComments(epicId: string): Promise<EpicComment[]> {
    return this.get(`/epics/${epicId}/comments`);
  }
  addComment(epicId: string, content: string): Promise<EpicComment> {
    return this.post(`/epics/${epicId}/comments`, { content });
  }
  deleteComment(epicId: string, commentId: string): Promise<{ message: string }> {
    return this.delete(`/epics/${epicId}/comments/${commentId}`);
  }
  linkFeature(epicId: string, featureId: string): Promise<{ message: string }> {
    return this.post(`/epics/${epicId}/features`, { featureId });
  }
  unlinkFeature(epicId: string, featureId: string): Promise<{ message: string }> {
    return this.delete(`/epics/${epicId}/features/${featureId}`);
  }
  addBlocker(epicId: string, blockerId: string): Promise<{ message: string }> {
    return this.post(`/epics/${epicId}/blockers`, { blockerId });
  }
  removeBlocker(epicId: string, blockerId: string): Promise<{ message: string }> {
    return this.delete(`/epics/${epicId}/blockers/${blockerId}`);
  }
}

export const epicsApi = new EpicsApiService();
