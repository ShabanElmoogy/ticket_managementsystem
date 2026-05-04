import { BaseApiService } from '@/src/services/api/base';
import { API, QUERY_KEYS } from '@/src/constants/api';
import type { CustomerVisit, CreateVisitData, UpdateVisitData } from '@/src/services/api/types/index';

export class CustomerVisitsApiService extends BaseApiService {
  getVisits  = (customerId: string)                              => this.get<CustomerVisit[]>(API.CUSTOMERS.VISITS(customerId));
  getVisit   = (customerId: string, visitId: string)            => this.get<CustomerVisit>(API.CUSTOMERS.VISIT_BY_ID(customerId, visitId));
  createVisit = (customerId: string, data: CreateVisitData)     => this.post<CustomerVisit>(API.CUSTOMERS.VISITS(customerId), data);
  updateVisit = (customerId: string, visitId: string, data: UpdateVisitData) =>
    this.put<CustomerVisit>(API.CUSTOMERS.VISIT_BY_ID(customerId, visitId), data);
  deleteVisit = (customerId: string, visitId: string)           => this.delete<{ message: string }>(API.CUSTOMERS.VISIT_BY_ID(customerId, visitId));
}

export const visitsApi  = new CustomerVisitsApiService();
export const visitsKeys = QUERY_KEYS.CUSTOMERS;
