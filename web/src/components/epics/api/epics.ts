import { BaseApiService } from '../../../services/api/base';
import type { Epic, CreateEpicData, UpdateEpicData, LinkedTicket } from '../../../services/api/types';

export interface EpicComment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface EpicActivityItem {
  id: string;
  action: string;
  meta: Record<string, any>;
  createdAt: string;
  user: { id: string; name: string } | null;
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
  listActivity(epicId: string): Promise<EpicActivityItem[]> {
    return this.get(`/epics/${epicId}/activity`);
  }
  addComment(epicId: string, content: string): Promise<EpicComment> {
    return this.post(`/epics/${epicId}/comments`, { content });
  }
  deleteComment(epicId: string, commentId: string): Promise<{ message: string }> {
    return this.delete(`/epics/${epicId}/comments/${commentId}`);
  }
  linkFeature(epicId: string, featureId: string): Promise<{ message: string; suggestedStatus: 'ACTIVE' | null }> {
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
  getWatchers(epicId: string): Promise<{ id: string; name: string; email: string }[]> {
    return this.get(`/epics/${epicId}/watchers`);
  }
  watch(epicId: string): Promise<{ watching: boolean }> {
    return this.post(`/epics/${epicId}/watch`, {});
  }
  unwatch(epicId: string): Promise<{ watching: boolean }> {
    return this.delete(`/epics/${epicId}/watch`);
  }
  listLinkedTickets(epicId: string): Promise<LinkedTicket[]> {
    return this.get(`/epics/${epicId}/tickets`);
  }
  linkTicket(epicId: string, ticketId: string): Promise<{ message: string }> {
    return this.post(`/epics/${epicId}/tickets`, { ticketId });
  }
  unlinkTicket(epicId: string, ticketId: string): Promise<{ message: string }> {
    return this.delete(`/epics/${epicId}/tickets/${ticketId}`);
  }
}

export const epicsApi = new EpicsApiService();
