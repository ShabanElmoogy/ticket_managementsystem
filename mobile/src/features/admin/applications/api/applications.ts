import { BaseApiService } from '@/src/services/api/base';
import { API, QUERY_KEYS } from '@/src/constants/api';
import type { Application, CreateApplicationData } from '@/src/services/api/types';

export class ApplicationsApiService extends BaseApiService {
  getApplications   = ()                                                   => this.get<Application[]>(API.APPLICATIONS.LIST);
  getApplication    = (id: string)                                         => this.get<Application>(API.APPLICATIONS.BY_ID(id));
  createApplication = (data: CreateApplicationData)                        => this.post<Application>(API.APPLICATIONS.LIST, data);
  updateApplication = (id: string, data: Partial<CreateApplicationData>)   => this.put<Application>(API.APPLICATIONS.BY_ID(id), data);
  deleteApplication = (id: string)                                         => this.delete<{ message: string }>(API.APPLICATIONS.BY_ID(id));
  assignCustomer    = (applicationId: string, customerId: string)          =>
    this.post<{ message: string }>(API.APPLICATIONS.ASSIGN_CUSTOMER, { applicationId, customerId });
  removeCustomer    = (applicationId: string, customerId: string)          =>
    this.delete<{ message: string }>(API.APPLICATIONS.REMOVE_CUSTOMER(applicationId, customerId));
}

export const applicationsApi  = new ApplicationsApiService();
export const applicationsKeys = QUERY_KEYS.APPLICATIONS;
