import { BaseApiService } from '../../../services/api/base';
import type { FeatureRequest, CreateFeatureData, UpdateFeatureData, FeatureStep, CreateStepData, UpdateStepData } from '../../../services/api/types';

class FeaturesApiService extends BaseApiService {
  list(): Promise<FeatureRequest[]> {
    return this.get('/features');
  }
  getOne(id: string): Promise<FeatureRequest> {
    return this.get(`/features/${id}`);
  }
  create(data: CreateFeatureData): Promise<FeatureRequest> {
    return this.post('/features', data);
  }
  update(id: string, data: UpdateFeatureData): Promise<FeatureRequest> {
    return this.put(`/features/${id}`, data);
  }
  remove(id: string): Promise<{ message: string }> {
    return this.delete(`/features/${id}`);
  }
  toggleVote(id: string): Promise<{ voteCount: number; votedByMe: boolean }> {
    return this.post(`/features/${id}/vote`, {});
  }
  // Steps
  listSteps(featureId: string): Promise<FeatureStep[]> {
    return this.get(`/features/${featureId}/steps`);
  }
  createStep(featureId: string, data: CreateStepData): Promise<FeatureStep> {
    return this.post(`/features/${featureId}/steps`, data);
  }
  updateStep(featureId: string, stepId: string, data: UpdateStepData): Promise<FeatureStep> {
    return this.put(`/features/${featureId}/steps/${stepId}`, data);
  }
  deleteStep(featureId: string, stepId: string): Promise<{ message: string }> {
    return this.delete(`/features/${featureId}/steps/${stepId}`);
  }
}

export const featuresApi = new FeaturesApiService();
