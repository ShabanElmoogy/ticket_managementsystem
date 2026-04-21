import { BaseApiService } from '@/src/services/api/base';
import type { Application, CreateApplicationData } from '@/src/services/api/types';

export class ApplicationsApiService extends BaseApiService {
  getApplications  = ()                                              => this.get<Application[]>('/applications');
  getApplication   = (id: string)                                   => this.get<Application>(`/applications/${id}`);
  createApplication = (data: CreateApplicationData)                 => this.post<Application>('/applications', data);
  updateApplication = (id: string, data: Partial<CreateApplicationData>) => this.put<Application>(`/applications/${id}`, data);
  deleteApplication = (id: string)                                  => this.delete<{ message: string }>(`/applications/${id}`);
}

export const applicationsApi = new ApplicationsApiService();

export const applicationsKeys = {
  all:    ['applications']                       as const,
  detail: (id: string) => ['applications', id]   as const,
};
